const express = require('express');
const noteRouter = express.Router();

const {admin} = require('../admin'); // Ensure Firebase Admin SDK is initialized in 'admin.js'
const firestore = admin.firestore();

noteRouter.post('/addNote',  async (req, res) => {
    try {
        const {  ...noteData } = req.body;
        console.log("Note data",noteData);
        
        const {userId} = noteData;

        if (!userId) return res.status(400).json({ error: "User ID is required" });
        const notesCollection = firestore.collection('notes');
        const noteRef = notesCollection.doc();
        const note = { ...noteData, id: noteRef.id, userId };

        const batch = firestore.batch();
        batch.set(noteRef, note);

        const userRef = firestore.collection('users').doc(userId);
        batch.update(userRef, { notes: admin.firestore.FieldValue.arrayUnion(noteRef) });

        await batch.commit();
        res.status(201).json({ message: 'Note added successfully', note });
    } catch (ex) {
        console.error("🔥 Error adding note:", ex);
        res.status(500).json({ error: "Failed to add note" });
    }
}
);

noteRouter.get('/all/:uid',  async (req, res) => {
    try {
        const notesCollection = firestore.collection('notes');
        const { uid } = req.params;
        const q = notesCollection.where('userId', '==', uid);

        const notesSnapshot = await q.get();
        let notes = notesSnapshot.docs.map(doc => doc.data());
        console.log(notes);

        res.status(200).json(notes);
    } catch (ex) {
        console.error("Error fetching notes:", ex);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
}
);

noteRouter.delete('/:noteId',  async (req, res) => {
    try {
        const { noteId } = req.params;
        const noteRef = firestore.collection('notes').doc(noteId);
        const noteDoc = await noteRef.get();

        const batch = admin.firestore().batch();
        batch.delete(noteRef);
        batch.update(firestore.collection('users').doc(noteDoc.data().userId), { notes: admin.firestore.FieldValue.arrayRemove(noteRef) });
        if (!noteDoc.exists) {
            return res.status(404).json({ error: "Note not found" });
        }

        await batch.commit();
        res.status(200).json({ message: "Note deleted successfully" });
    } catch (ex) {
        console.error("🔥 Error deleting note:", ex);
        res.status(500).json({ error: "Failed to delete note" });
    }
}
);

noteRouter.get('/:noteId',  async (req, res) => {
    try {
        const { noteId } = req.params;
        const noteRef = firestore.collection('notes').doc(noteId);
        const noteDoc = await noteRef.get();

        if (!noteDoc.exists) {
            return res.status(404).json({ error: "Note not found" });
        }

        res.status(200).json(noteDoc.data());
    } catch (ex) {
        console.error("🔥 Error fetching note:", ex);
        res.status(500).json({ error: "Failed to fetch note" });
    }
}
);

noteRouter.put('/:noteId',  async (req, res) => {
    try {
        const { noteId } = req.params;
        const noteRef = firestore.collection('notes').doc(noteId);
        const noteDoc = await noteRef.get();

        if (!noteDoc.exists) {
            return res.status(404).json({ error: "Note not found" });
        }

        await noteRef.update(req.body);
        res.status(200).json({ message: "Note updated successfully" });
    } catch (ex) {
        console.error("🔥 Error updating note:", ex);
        res.status(500).json({ error: "Failed to update note" });
    }
}
);

const now = new Date() ;
const appointments = [];
appointments.filter((appointment) => appointment.date > now);

module.exports = noteRouter;