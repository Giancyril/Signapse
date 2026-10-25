/**
 * practice.ts - Types, difficulty tiers, and curated metadata for Practice Mode
 */

export type DifficultyTier = 'all' | 'beginner' | 'intermediate' | 'advanced';

export interface PracticeTarget {
  gloss: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  hint: string;
}

export interface PracticeStats {
  streak: number;
  bestStreak: number;
  completedCount: number;
  totalAttempts: number;
  accuracy: number;
  sessionStartTime: number;
}

export interface PracticeFeedback {
  matchedWord: string;
  confidence: number;
  timestamp: number;
  success: boolean;
}

// Categorized metadata for WLASL100 signs
export const PRACTICE_CATALOG: PracticeTarget[] = [
  // Beginner (High frequency, distinct single-hand or symmetrical signs)
  { gloss: "yes", difficulty: "beginner", category: "Basics", hint: "Fist nodding up and down like a head nod." },
  { gloss: "no", difficulty: "beginner", category: "Basics", hint: "Index and middle fingers tap onto the thumb." },
  { gloss: "help", difficulty: "beginner", category: "Basics", hint: "Thumbs-up on flat palm, lifting upward." },
  { gloss: "drink", difficulty: "beginner", category: "Food & Drink", hint: "Mime tipping a small cup to your mouth." },
  { gloss: "eat", difficulty: "beginner", category: "Food & Drink", hint: "Squished O-hand taps to your mouth twice." },
  { gloss: "book", difficulty: "beginner", category: "Objects", hint: "Palms together, open hands outward like a book." },
  { gloss: "walk", difficulty: "beginner", category: "Actions", hint: "Flat hands palm-down, alternately stepping forward." },
  { gloss: "go", difficulty: "beginner", category: "Actions", hint: "Index fingers point and roll outward forward." },
  { gloss: "cool", difficulty: "beginner", category: "Feelings", hint: "Fanning hand beside face, or thumbs-up chest twist." },
  { gloss: "hot", difficulty: "beginner", category: "Feelings", hint: "Claw hand near mouth twists out and down quickly." },
  { gloss: "black", difficulty: "beginner", category: "Colors", hint: "Index finger traces across the forehead." },
  { gloss: "blue", difficulty: "beginner", category: "Colors", hint: "B-hand shakes gently side to side." },
  { gloss: "white", difficulty: "beginner", category: "Colors", hint: "Open hand pulls outward from chest into an O-shape." },
  { gloss: "red", difficulty: "beginner", category: "Colors", hint: "Index finger strokes down across the lips." },
  { gloss: "orange", difficulty: "beginner", category: "Colors", hint: "C-hand squeezes like an orange at your chin." },
  { gloss: "dog", difficulty: "beginner", category: "Animals", hint: "Pat thigh then snap fingers, or quick double snap." },
  { gloss: "bird", difficulty: "beginner", category: "Animals", hint: "Index and thumb at mouth opening and closing like a beak." },
  { gloss: "cow", difficulty: "beginner", category: "Animals", hint: "Y-hand thumb on temple twisting forward like a horn." },
  { gloss: "fish", difficulty: "beginner", category: "Animals", hint: "Flat hand swimming forward through the air." },
  { gloss: "man", difficulty: "beginner", category: "People", hint: "Thumb touches forehead, then moves to upper chest." },
  { gloss: "woman", difficulty: "beginner", category: "People", hint: "Thumb touches chin, then moves to upper chest." },
  { gloss: "mother", difficulty: "beginner", category: "People", hint: "Open 5-hand thumb taps twice on your chin." },
  { gloss: "family", difficulty: "beginner", category: "People", hint: "Two F-hands circle outward and touch little fingers." },
  { gloss: "bed", difficulty: "beginner", category: "Objects", hint: "Palms together beside cheek, tilting head as if resting." },
  { gloss: "table", difficulty: "beginner", category: "Objects", hint: "Forearms stacked horizontally, tapping twice." },
  { gloss: "time", difficulty: "beginner", category: "Basics", hint: "Index finger taps the back of your wrist like a watch." },
  { gloss: "now", difficulty: "beginner", category: "Basics", hint: "Bent Y-hands drop downward firmly." },
  { gloss: "all", difficulty: "beginner", category: "Basics", hint: "One hand sweeps in a circle around the other." },
  { gloss: "fine", difficulty: "beginner", category: "Basics", hint: "Open 5-hand thumb taps center of chest." },
  { gloss: "like", difficulty: "beginner", category: "Feelings", hint: "Thumb and middle finger pull outward from chest." },

  // Intermediate (Two-handed compound motions and body shifts)
  { gloss: "computer", difficulty: "intermediate", category: "Technology", hint: "C-hand slides up the forearm of your non-dominant arm." },
  { gloss: "chair", difficulty: "intermediate", category: "Objects", hint: "Two curved fingers tap on the other two curved fingers." },
  { gloss: "clothes", difficulty: "intermediate", category: "Objects", hint: "Open hands brush downward against upper chest twice." },
  { gloss: "candy", difficulty: "intermediate", category: "Food & Drink", hint: "Index finger twists into the side of the cheek." },
  { gloss: "apple", difficulty: "intermediate", category: "Food & Drink", hint: "Knuckle of X-hand twists against the cheek." },
  { gloss: "corn", difficulty: "intermediate", category: "Food & Drink", hint: "Hands hold cob and twist across the mouth." },
  { gloss: "pizza", difficulty: "intermediate", category: "Food & Drink", hint: "Z-shaped double finger trace or P-hand slice." },
  { gloss: "study", difficulty: "intermediate", category: "Actions", hint: "Fingers flutter toward flat non-dominant palm." },
  { gloss: "play", difficulty: "intermediate", category: "Actions", hint: "Two Y-hands shake playfully in front of you." },
  { gloss: "dance", difficulty: "intermediate", category: "Actions", hint: "V-hand swings back and forth over flat palm." },
  { gloss: "work", difficulty: "intermediate", category: "Actions", hint: "Fist taps the wrist of the non-dominant fist." },
  { gloss: "give", difficulty: "intermediate", category: "Actions", hint: "Flattened O-hands extend outward toward the viewer." },
  { gloss: "want", difficulty: "intermediate", category: "Actions", hint: "Clawed hands pull toward your body." },
  { gloss: "tell", difficulty: "intermediate", category: "Actions", hint: "Index finger points from chin straight outward." },
  { gloss: "meet", difficulty: "intermediate", category: "Actions", hint: "Two index fingers upright come together." },
  { gloss: "change", difficulty: "intermediate", category: "Actions", hint: "Two fists twist and swap top and bottom positions." },
  { gloss: "finish", difficulty: "intermediate", category: "Basics", hint: "Open hands facing inward flick outward quickly." },
  { gloss: "wrong", difficulty: "intermediate", category: "Basics", hint: "Y-hand knuckle touches the center of the chin." },
  { gloss: "right", difficulty: "intermediate", category: "Basics", hint: "Index finger hand chops onto the other index finger." },
  { gloss: "same", difficulty: "intermediate", category: "Basics", hint: "Y-hand slides side to side horizontally." },
  { gloss: "need", difficulty: "intermediate", category: "Basics", hint: "Bent X-hand drops down decisively." },
  { gloss: "can", difficulty: "intermediate", category: "Basics", hint: "Two S-fists drop down in unison." },
  { gloss: "before", difficulty: "intermediate", category: "Time", hint: "Open hand moves backward over shoulder." },
  { gloss: "later", difficulty: "intermediate", category: "Time", hint: "L-hand twists forward like clock hands moving." },
  { gloss: "last", difficulty: "intermediate", category: "Time", hint: "Little finger strikes down past the other little finger." },
  { gloss: "year", difficulty: "intermediate", category: "Time", hint: "One fist orbits around the other and lands on top." },
  { gloss: "thursday", difficulty: "intermediate", category: "Time", hint: "H-hand traces a small clockwise circle." },
  { gloss: "doctor", difficulty: "intermediate", category: "People", hint: "Bent hand taps the pulse point of the wrist." },
  { gloss: "school", difficulty: "intermediate", category: "Places", hint: "Flat dominant hand claps down onto flat other hand twice." },
  { gloss: "city", difficulty: "intermediate", category: "Places", hint: "Fingertips tap together making roof shapes across." },

  // Advanced (Complex coordination, fingerspelling roots, spatial constraints)
  { gloss: "accident", difficulty: "advanced", category: "Events", hint: "Open hands crash into fists toward each other." },
  { gloss: "graduate", difficulty: "advanced", category: "Events", hint: "G-hand circles in the air and lands on flat palm." },
  { gloss: "thanksgiving", difficulty: "advanced", category: "Events", hint: "Two hands move from chin and chest outward in prayer." },
  { gloss: "birthday", difficulty: "advanced", category: "Events", hint: "Middle finger touches chin then touches chest." },
  { gloss: "deaf", difficulty: "advanced", category: "Community", hint: "Index finger touches near ear then near mouth." },
  { gloss: "hearing", difficulty: "advanced", category: "Community", hint: "Index finger rolls in small circles near mouth." },
  { gloss: "language", difficulty: "advanced", category: "Community", hint: "Two L-hands wiggle and pull apart horizontally." },
  { gloss: "basketball", difficulty: "advanced", category: "Sports", hint: "Two claw hands flick upward twice as if holding a ball." },
  { gloss: "bowling", difficulty: "advanced", category: "Sports", hint: "Mime swinging and releasing a bowling ball." },
  { gloss: "medicine", difficulty: "advanced", category: "Health", hint: "Middle finger wiggles in the center of the open palm." },
  { gloss: "secretary", difficulty: "advanced", category: "People", hint: "U-hand taps lips then flat palm, then agent suffix." },
  { gloss: "cousin", difficulty: "advanced", category: "People", hint: "C-hand shakes near side of head or temple." },
  { gloss: "son", difficulty: "advanced", category: "People", hint: "Salute from forehead, then cradle baby in arms." },
  { gloss: "decide", difficulty: "advanced", category: "Thinking", hint: "Index finger at temple, drops down into F-hands." },
  { gloss: "forget", difficulty: "advanced", category: "Thinking", hint: "Hand wipes across forehead into a loose fist." },
  { gloss: "cheat", difficulty: "advanced", category: "Actions", hint: "Elbow horns rest on hand, moving forward." },
  { gloss: "paint", difficulty: "advanced", category: "Actions", hint: "Flat hand brushes up and down across other palm." },
  { gloss: "pull", difficulty: "advanced", category: "Actions", hint: "Two curved hands pull back firmly toward body." },
  { gloss: "letter", difficulty: "advanced", category: "Objects", hint: "Thumb touches tongue/lips then taps other thumbnail." },
  { gloss: "paper", difficulty: "advanced", category: "Objects", hint: "Heel of palms brush against each other inward twice." },
  { gloss: "shirt", difficulty: "advanced", category: "Objects", hint: "Index and thumb tug lightly at shirt cloth." },
  { gloss: "hat", difficulty: "advanced", category: "Objects", hint: "Open hand pats down on top of head twice." },
  { gloss: "jacket", difficulty: "advanced", category: "Objects", hint: "Y-hands mime pulling a jacket lapel onto shoulders." },
  { gloss: "kiss", difficulty: "advanced", category: "Feelings", hint: "Fingertips touch lips, then come together touching other hand." },
  { gloss: "enjoy", difficulty: "advanced", category: "Feelings", hint: "Hands rub circles on chest and stomach in unison." },
  { gloss: "pink", difficulty: "advanced", category: "Colors", hint: "P-hand middle finger strokes downward on chin." },
  { gloss: "purple", difficulty: "advanced", category: "Colors", hint: "P-hand shakes side to side gently." },
  { gloss: "brown", difficulty: "advanced", category: "Colors", hint: "B-hand slides downward along the cheek." },
  { gloss: "full", difficulty: "advanced", category: "Descriptors", hint: "Flat hand sweeps across top of fist toward body." },
  { gloss: "tall", difficulty: "advanced", category: "Descriptors", hint: "Index finger slides straight up along flat vertical palm." },
  { gloss: "short", difficulty: "advanced", category: "Descriptors", hint: "Flat hand hovers low, patting downward." },
  { gloss: "thin", difficulty: "advanced", category: "Descriptors", hint: "Little fingers pull apart vertically while cheeks suck in." },
  { gloss: "dark", difficulty: "advanced", category: "Descriptors", hint: "Open hands cross downward in front of face." },
  { gloss: "many", difficulty: "advanced", category: "Descriptors", hint: "Fists flick open upward into 5-hands repeatedly." },
  { gloss: "what", difficulty: "advanced", category: "Questions", hint: "Open hands palm up shake side to side." },
  { gloss: "who", difficulty: "advanced", category: "Questions", hint: "Thumb on chin, index finger wiggles up and down." },
  { gloss: "how", difficulty: "advanced", category: "Questions", hint: "Back of curved hands touch, rolling outward palm-up." },
  { gloss: "but", difficulty: "advanced", category: "Grammar", hint: "Index fingers cross and pull apart quickly." }
];

export function getTargetsByDifficulty(tier: DifficultyTier): PracticeTarget[] {
  if (tier === 'all') return PRACTICE_CATALOG;
  return PRACTICE_CATALOG.filter((t) => t.difficulty === tier);
}

export function getRandomTarget(
  tier: DifficultyTier = 'all',
  excludeGloss?: string
): PracticeTarget {
  const pool = getTargetsByDifficulty(tier).filter((t) => t.gloss !== excludeGloss);
  if (pool.length === 0) return PRACTICE_CATALOG[0];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}