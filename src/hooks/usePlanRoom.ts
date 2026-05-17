import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Plan, Participant, OperationType } from '../types';
import { handleFirestoreError } from '../App';

export function usePlanRoom(accessCode: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessCode) return;

    setLoading(true);
    const planRef = doc(db, 'plans', accessCode);
    const partsRef = collection(db, 'plans', accessCode, 'participants');

    const unsubPlan = onSnapshot(planRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Plan;
        const now = new Date();
        const expiry = data.expiresAt.toDate();
        
        if (expiry < now) {
           setError('PLAN_EXPIRED');
        } else {
           setPlan(data);
        }
      } else {
        setError('PLAN_NOT_FOUND');
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `plans/${accessCode}`);
      setError(err.message);
      setLoading(false);
    });

    const unsubParts = onSnapshot(partsRef, (snap) => {
      const p = snap.docs.map(d => ({ ...d.data(), id: d.id } as Participant));
      setParticipants(p);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `plans/${accessCode}/participants`);
    });

    return () => {
      unsubPlan();
      unsubParts();
    };
  }, [accessCode]);

  const joinPlan = async (displayName: string) => {
    if (!auth.currentUser || !accessCode) return;
    
    const partRef = doc(db, 'plans', accessCode, 'participants', auth.currentUser.uid);
    const p: any = {
      id: auth.currentUser.uid,
      displayName,
      availability: [],
      lastActive: serverTimestamp(),
    };

    try {
      await setDoc(partRef, p);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `plans/${accessCode}/participants/${auth.currentUser.uid}`);
    }
  };

  const toggleAvailability = async (slot: string) => {
    if (!auth.currentUser || !accessCode) return;
    const myId = auth.currentUser.uid;
    const myPart = participants.find(p => p.id === myId);
    if (!myPart) return;

    let newAvail = [...myPart.availability];
    if (newAvail.includes(slot)) {
      newAvail = newAvail.filter(s => s !== slot);
    } else {
      newAvail.push(slot);
    }

    const partRef = doc(db, 'plans', accessCode, 'participants', myId);
    try {
      await setDoc(partRef, { availability: newAvail, lastActive: serverTimestamp() }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `plans/${accessCode}/participants/${myId}`);
    }
  };

  return { plan, participants, loading, error, joinPlan, toggleAvailability };
}
