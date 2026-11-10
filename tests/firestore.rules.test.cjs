const fs = require("node:fs");
const path = require("node:path");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");
const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} = require("firebase/firestore");

const projectId = "demo-skill-hustle";
const aliceUid = "sh_alice";
const bobUid = "sh_bob";
const outsiderUid = "sh_outsider";
const conversationId = "a".repeat(64);

let testEnvironment;

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync(
        path.resolve(__dirname, "..", "firestore.rules"),
        "utf8"
      ),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, "users", aliceUid), {
      uid: aliceUid,
      roles: ["client"],
      status: "active",
    });
    await setDoc(doc(firestore, "users", bobUid), {
      uid: bobUid,
      roles: ["freelancer"],
      status: "active",
    });
    await setDoc(doc(firestore, "users", outsiderUid), {
      uid: outsiderUid,
      roles: ["client"],
      status: "active",
    });
    await setDoc(doc(firestore, "authIdentities", "identity-alice"), {
      uid: aliceUid,
      provider: "google",
    });
    await setDoc(doc(firestore, "conversations", conversationId), {
      participantUids: [aliceUid, bobUid],
      participantProfiles: [
        { uid: aliceUid, name: "Alice", photoURL: null },
        { uid: bobUid, name: "Bob", photoURL: null },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageText: "Hello",
      lastMessageAt: new Date(),
      lastMessageSenderUid: aliceUid,
      readAtByUid: {},
    });
    await setDoc(
      doc(
        firestore,
        "conversations",
        conversationId,
        "messages",
        "message-1"
      ),
      {
        senderUid: aliceUid,
        body: "Hello",
        createdAt: new Date(),
      }
    );
  });
});

after(async () => {
  await testEnvironment?.cleanup();
});

test("authenticated participants can read their conversation and messages", async () => {
  const alice = testEnvironment.authenticatedContext(aliceUid).firestore();
  const bob = testEnvironment.authenticatedContext(bobUid).firestore();

  await assertSucceeds(
    getDoc(doc(alice, "conversations", conversationId))
  );
  await assertSucceeds(
    getDoc(
      doc(alice, "conversations", conversationId, "messages", "message-1")
    )
  );
  await assertSucceeds(
    getDocs(
      query(
        collection(bob, "conversations"),
        where("participantUids", "array-contains", bobUid)
      )
    )
  );
});

test("an authenticated outsider cannot read a conversation or its messages", async () => {
  const outsider = testEnvironment
    .authenticatedContext(outsiderUid)
    .firestore();

  await assertFails(
    getDoc(doc(outsider, "conversations", conversationId))
  );
  await assertFails(
    getDoc(
      doc(
        outsider,
        "conversations",
        conversationId,
        "messages",
        "message-1"
      )
    )
  );
  await assertFails(
    getDocs(
      query(
        collection(outsider, "conversations"),
        where("participantUids", "array-contains", outsiderUid)
      )
    )
  );
});

test("clients cannot modify roles or write conversations and messages", async () => {
  const alice = testEnvironment.authenticatedContext(aliceUid).firestore();

  await assertFails(
    updateDoc(doc(alice, "users", aliceUid), {
      roles: ["admin"],
    })
  );
  await assertFails(
    setDoc(doc(alice, "conversations", "b".repeat(64)), {
      participantUids: [aliceUid, outsiderUid],
    })
  );
  await assertFails(
    setDoc(
      doc(
        alice,
        "conversations",
        conversationId,
        "messages",
        "forged-message"
      ),
      { senderUid: aliceUid, body: "forged" }
    )
  );
});

test("private identity records are inaccessible and users can only read themselves", async () => {
  const alice = testEnvironment.authenticatedContext(aliceUid).firestore();

  await assertSucceeds(getDoc(doc(alice, "users", aliceUid)));
  await assertFails(getDoc(doc(alice, "users", bobUid)));
  await assertFails(getDoc(doc(alice, "authIdentities", "identity-alice")));
});

test("unauthenticated clients cannot read conversations", async () => {
  const anonymous = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(
    getDoc(doc(anonymous, "conversations", conversationId))
  );
});

test("disabled accounts cannot read conversations", async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), "users", aliceUid), {
      status: "disabled",
    });
  });
  const alice = testEnvironment.authenticatedContext(aliceUid).firestore();

  await assertFails(
    getDoc(doc(alice, "conversations", conversationId))
  );
  await assertFails(
    getDoc(
      doc(alice, "conversations", conversationId, "messages", "message-1")
    )
  );
});
