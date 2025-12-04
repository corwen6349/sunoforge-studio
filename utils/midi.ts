
/**
 * Utility to create a Standard MIDI File (Type 0) from a chord progression.
 * This does not rely on external libraries.
 */

// Helper to convert string to char codes
const s2a = (str: string) => str.split('').map(c => c.charCodeAt(0));

// Variable Length Quantity encoder
const toVLQ = (num: number): number[] => {
  let buffer = num & 0x7f;
  let values = [buffer];
  num = num >> 7;
  while (num > 0) {
    buffer = (num & 0x7f) | 0x80;
    values.unshift(buffer);
    num = num >> 7;
  }
  return values;
};

// Helper to write a 32-bit int (big endian)
const write32 = (num: number) => [
  (num >> 24) & 0xFF,
  (num >> 16) & 0xFF,
  (num >> 8) & 0xFF,
  num & 0xFF
];

// Helper to write a 16-bit int (big endian)
const write16 = (num: number) => [
  (num >> 8) & 0xFF,
  num & 0xFF
];

// Helper to write a 24-bit int (big endian)
const write24 = (num: number) => [
  (num >> 16) & 0xFF,
  (num >> 8) & 0xFF,
  num & 0xFF
];

// Musical Logic
const NOTE_MAP: { [key: string]: number } = {
  'C': 0, 'C#': 1, 'DB': 1,
  'D': 2, 'D#': 3, 'EB': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'GB': 6,
  'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10,
  'B': 11
};

const getChordNotes = (chord: string, octave = 4): number[] => {
  const rootMatch = chord.match(/^([A-G][#b]?)/i);
  if (!rootMatch) return [];
  
  let rootStr = rootMatch[1].toUpperCase();
  if (rootStr.length > 1 && rootStr[1] === 'b') rootStr = rootStr[0] + 'B'; // Normalize Db -> DB

  const rootNote = NOTE_MAP[rootStr];
  if (rootNote === undefined) return [];

  const rootMidi = rootNote + (octave + 1) * 12;
  const notes = [rootMidi]; // Root

  // Simple quality parsing
  const isMinor = /m(?!aj)/.test(chord);
  const isDim = /dim|°/.test(chord);
  const isAug = /aug|\+/.test(chord);
  const isMaj7 = /maj7|M7/.test(chord);
  const isDom7 = /7/.test(chord) && !isMaj7;

  // Third
  if (isMinor || isDim) {
    notes.push(rootMidi + 3); // Minor 3rd
  } else if (isAug) {
     notes.push(rootMidi + 4); // Major 3rd (Augmented triad uses Major 3rd)
  } else {
    notes.push(rootMidi + 4); // Major 3rd
  }

  // Fifth
  if (isDim) {
    notes.push(rootMidi + 6); // Diminished 5th
  } else if (isAug) {
    notes.push(rootMidi + 8); // Augmented 5th
  } else {
    notes.push(rootMidi + 7); // Perfect 5th
  }

  // Seventh (Optional simple handling)
  if (isMaj7) notes.push(rootMidi + 11);
  if (isDom7 || (isMinor && /7/.test(chord))) notes.push(rootMidi + 10);

  return notes;
};

export const createMidiFile = (bpmStr: string = "120", chords: string[] = []): Blob => {
  const bpm = parseInt(bpmStr) || 120;
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  
  // Header Chunk
  // MThd, length 6, format 0 (single track), 1 track, 480 ticks per beat
  const header = [
    ...s2a('MThd'), 
    ...write32(6),
    ...write16(0), // Type 0
    ...write16(1), // 1 Track
    ...write16(480) // Ticks per quarter note
  ];

  // Track Data Construction
  let trackEvents: number[] = [];

  // 1. Set Tempo Meta Event (FF 51 03 tt tt tt)
  trackEvents.push(0); // Delta time 0
  trackEvents.push(0xFF, 0x51, 0x03, ...write24(microsecondsPerBeat));

  // 2. Add Chords
  // Assume 4/4 time, each chord lasts 1 bar (4 beats * 480 ticks = 1920 ticks)
  // For simplicity, let's do 1 chord = 4 beats (Whole note)
  const TICKS_PER_CHORD = 480 * 4;

  chords.forEach((chord) => {
    const notes = getChordNotes(chord);
    if (notes.length === 0) return;

    // Note On (Velocity 90)
    // All notes of the chord start at the same time (Delta 0 for subsequent notes)
    notes.forEach((note, index) => {
      // First note of chord usually has the delta of the previous duration, 
      // but here we are in a loop.
      // Wait: In MIDI, delta is time SINCE LAST EVENT.
      // So for a chord:
      // Event 1: Note On (Delta = TICKS_PER_CHORD if it's not the first chord, else 0)
      // Event 2: Note On (Delta = 0)
      // ...
      // Event N: Note Off (Delta = TICKS_PER_CHORD) ??
      
      // Correct approach for Block Chords:
      // Time 0: Note On A, Note On B, Note On C
      // Time 1920: Note Off A, Note Off B, Note Off C
    });

    // Start Chord
    notes.forEach((note, i) => {
      trackEvents.push(...toVLQ(i === 0 ? 0 : 0)); // Delta 0 for start
      trackEvents.push(0x90, note, 90); // Note On Ch 0
    });

    // End Chord (Duration)
    notes.forEach((note, i) => {
      // First note off carries the time duration
      trackEvents.push(...toVLQ(i === 0 ? TICKS_PER_CHORD : 0)); 
      trackEvents.push(0x80, note, 0); // Note Off Ch 0
    });
  });

  // End of Track Meta Event
  trackEvents.push(0, 0xFF, 0x2F, 0x00);

  // Track Chunk Header
  const trackHeader = [
    ...s2a('MTrk'),
    ...write32(trackEvents.length)
  ];

  const fileBytes = new Uint8Array([...header, ...trackHeader, ...trackEvents]);
  return new Blob([fileBytes], { type: 'audio/midi' });
};
