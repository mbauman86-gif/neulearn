import { db } from "./db";
import { skills } from "@shared/schema";

type SkillData = {
  subject: string;
  strand: string;
  gradeLevel: string;
  standardCode?: string;
  name: string;
  description: string;
  orderInStrand: number;
};

const K2_SKILLS: SkillData[] = [
  // ============================================
  // READING SKILLS
  // ============================================
  
  // Kindergarten Reading - Phonemic Awareness
  { subject: "READING", strand: "phonemic_awareness", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.2.A", name: "Rhyme Recognition", description: "Recognize and produce rhyming words", orderInStrand: 1 },
  { subject: "READING", strand: "phonemic_awareness", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.2.B", name: "Syllable Counting", description: "Count, pronounce, blend, and segment syllables in spoken words", orderInStrand: 2 },
  { subject: "READING", strand: "phonemic_awareness", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.2.C", name: "Beginning Sounds", description: "Blend and segment onsets and rimes of single-syllable spoken words", orderInStrand: 3 },
  { subject: "READING", strand: "phonemic_awareness", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.2.D", name: "Sound Isolation", description: "Isolate and pronounce the initial, medial vowel, and final sounds in CVC words", orderInStrand: 4 },
  
  // Kindergarten Reading - Phonics
  { subject: "READING", strand: "phonics", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.3.A", name: "Letter-Sound Correspondence", description: "Demonstrate basic knowledge of one-to-one letter-sound correspondences", orderInStrand: 1 },
  { subject: "READING", strand: "phonics", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.3.B", name: "Short Vowel Sounds", description: "Associate the long and short sounds with common spellings for the five major vowels", orderInStrand: 2 },
  { subject: "READING", strand: "phonics", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.3.C", name: "CVC Word Reading", description: "Read common high-frequency words by sight and decode simple CVC words", orderInStrand: 3 },
  
  // Kindergarten Reading - Fluency
  { subject: "READING", strand: "fluency", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RF.K.4", name: "Emergent Reader Behaviors", description: "Read emergent-reader texts with purpose and understanding", orderInStrand: 1 },
  
  // Kindergarten Reading - Comprehension
  { subject: "READING", strand: "comprehension", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RL.K.1", name: "Story Questions", description: "With prompting, ask and answer questions about key details in a text", orderInStrand: 1 },
  { subject: "READING", strand: "comprehension", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RL.K.2", name: "Story Retelling", description: "With prompting, retell familiar stories including key details", orderInStrand: 2 },
  { subject: "READING", strand: "comprehension", gradeLevel: "K", standardCode: "CCSS.ELA-LITERACY.RL.K.3", name: "Character Identification", description: "Identify characters, settings, and major events in a story", orderInStrand: 3 },
  
  // Grade 1 Reading - Phonics
  { subject: "READING", strand: "phonics", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RF.1.2.A", name: "Phoneme Distinction", description: "Distinguish long from short vowel sounds in spoken single-syllable words", orderInStrand: 1 },
  { subject: "READING", strand: "phonics", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RF.1.3.A", name: "Digraphs", description: "Know the spelling-sound correspondences for common consonant digraphs", orderInStrand: 2 },
  { subject: "READING", strand: "phonics", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RF.1.3.B", name: "Final -e Pattern", description: "Decode regularly spelled one-syllable words with final -e", orderInStrand: 3 },
  { subject: "READING", strand: "phonics", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RF.1.3.C", name: "Vowel Teams", description: "Know final -e and common vowel team conventions for representing long vowel sounds", orderInStrand: 4 },
  { subject: "READING", strand: "phonics", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RF.1.3.G", name: "Syllable Types", description: "Recognize and read grade-appropriate irregularly spelled words", orderInStrand: 5 },
  
  // Grade 1 Reading - Fluency
  { subject: "READING", strand: "fluency", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RF.1.4.A", name: "Purpose and Understanding", description: "Read on-level text with purpose and understanding", orderInStrand: 1 },
  { subject: "READING", strand: "fluency", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RF.1.4.B", name: "Oral Reading Fluency", description: "Read on-level text orally with accuracy, rate, and expression", orderInStrand: 2 },
  
  // Grade 1 Reading - Comprehension
  { subject: "READING", strand: "comprehension", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RL.1.1", name: "Key Details", description: "Ask and answer questions about key details in a text", orderInStrand: 1 },
  { subject: "READING", strand: "comprehension", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RL.1.2", name: "Central Message", description: "Retell stories, demonstrating understanding of the central message", orderInStrand: 2 },
  { subject: "READING", strand: "comprehension", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RL.1.3", name: "Story Elements", description: "Describe characters, settings, and major events using key details", orderInStrand: 3 },
  { subject: "READING", strand: "comprehension", gradeLevel: "1", standardCode: "CCSS.ELA-LITERACY.RL.1.7", name: "Text-Illustration Connection", description: "Use illustrations and details to describe characters, settings, or events", orderInStrand: 4 },
  
  // Grade 2 Reading - Phonics
  { subject: "READING", strand: "phonics", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RF.2.3.A", name: "Long Vowel Patterns", description: "Distinguish long and short vowels when reading regularly spelled one-syllable words", orderInStrand: 1 },
  { subject: "READING", strand: "phonics", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RF.2.3.B", name: "Vowel Diphthongs", description: "Know spelling-sound correspondences for additional common vowel teams", orderInStrand: 2 },
  { subject: "READING", strand: "phonics", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RF.2.3.C", name: "Two-Syllable Words", description: "Decode regularly spelled two-syllable words with long vowels", orderInStrand: 3 },
  { subject: "READING", strand: "phonics", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RF.2.3.D", name: "Prefixes and Suffixes", description: "Decode words with common prefixes and suffixes", orderInStrand: 4 },
  
  // Grade 2 Reading - Fluency
  { subject: "READING", strand: "fluency", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RF.2.4", name: "Grade-Level Fluency", description: "Read with sufficient accuracy and fluency to support comprehension", orderInStrand: 1 },
  
  // Grade 2 Reading - Comprehension
  { subject: "READING", strand: "comprehension", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RL.2.1", name: "Who What Where When", description: "Ask and answer who, what, where, when, why, and how questions", orderInStrand: 1 },
  { subject: "READING", strand: "comprehension", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RL.2.2", name: "Lesson or Moral", description: "Recount stories and determine central message, lesson, or moral", orderInStrand: 2 },
  { subject: "READING", strand: "comprehension", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RL.2.3", name: "Character Response", description: "Describe how characters respond to major events and challenges", orderInStrand: 3 },
  { subject: "READING", strand: "comprehension", gradeLevel: "2", standardCode: "CCSS.ELA-LITERACY.RL.2.5", name: "Story Structure", description: "Describe overall structure of story including beginning and ending", orderInStrand: 4 },

  // ============================================
  // MATH SKILLS
  // ============================================
  
  // Kindergarten Math - Counting
  { subject: "MATH", strand: "counting", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.CC.A.1", name: "Count to 100", description: "Count to 100 by ones and by tens", orderInStrand: 1 },
  { subject: "MATH", strand: "counting", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.CC.A.2", name: "Count Forward", description: "Count forward beginning from a given number within 100", orderInStrand: 2 },
  { subject: "MATH", strand: "counting", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.CC.A.3", name: "Write Numbers 0-20", description: "Write numbers from 0 to 20 and represent objects with a numeral", orderInStrand: 3 },
  { subject: "MATH", strand: "counting", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.CC.B.4", name: "One-to-One Correspondence", description: "Count objects using one-to-one correspondence", orderInStrand: 4 },
  { subject: "MATH", strand: "counting", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.CC.B.5", name: "Count Objects to 20", description: "Count to answer 'how many?' questions about objects up to 20", orderInStrand: 5 },
  
  // Kindergarten Math - Number Comparison
  { subject: "MATH", strand: "number_sense", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.CC.C.6", name: "Compare Numbers", description: "Identify whether one group has more, less, or the same as another", orderInStrand: 1 },
  { subject: "MATH", strand: "number_sense", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.CC.C.7", name: "Compare Written Numbers", description: "Compare two numbers between 1 and 10 as written numerals", orderInStrand: 2 },
  
  // Kindergarten Math - Operations
  { subject: "MATH", strand: "operations", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.OA.A.1", name: "Addition Stories", description: "Represent addition with objects, fingers, drawings, or acting out", orderInStrand: 1 },
  { subject: "MATH", strand: "operations", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.OA.A.2", name: "Subtraction Stories", description: "Represent subtraction with objects, fingers, drawings, or acting out", orderInStrand: 2 },
  { subject: "MATH", strand: "operations", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.OA.A.3", name: "Decompose Numbers to 10", description: "Decompose numbers less than or equal to 10 into pairs", orderInStrand: 3 },
  { subject: "MATH", strand: "operations", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.OA.A.4", name: "Make 10", description: "Find the number that makes 10 when added to any number 1-9", orderInStrand: 4 },
  { subject: "MATH", strand: "operations", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.OA.A.5", name: "Add and Subtract within 5", description: "Fluently add and subtract within 5", orderInStrand: 5 },
  
  // Kindergarten Math - Geometry
  { subject: "MATH", strand: "geometry", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.G.A.1", name: "Position Words", description: "Describe positions using above, below, beside, in front of, behind, next to", orderInStrand: 1 },
  { subject: "MATH", strand: "geometry", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.G.A.2", name: "2D Shape Names", description: "Name shapes regardless of size or orientation (circles, squares, triangles, rectangles)", orderInStrand: 2 },
  { subject: "MATH", strand: "geometry", gradeLevel: "K", standardCode: "CCSS.MATH.CONTENT.K.G.B.4", name: "Analyze Shapes", description: "Analyze and compare 2D and 3D shapes using informal language", orderInStrand: 3 },
  
  // Grade 1 Math - Operations
  { subject: "MATH", strand: "operations", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.OA.A.1", name: "Add within 20", description: "Use addition within 20 to solve word problems", orderInStrand: 1 },
  { subject: "MATH", strand: "operations", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.OA.A.2", name: "Subtract within 20", description: "Use subtraction within 20 to solve word problems", orderInStrand: 2 },
  { subject: "MATH", strand: "operations", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.OA.B.3", name: "Commutative Property", description: "Apply commutative property of addition", orderInStrand: 3 },
  { subject: "MATH", strand: "operations", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.OA.B.4", name: "Subtraction as Unknown Addend", description: "Understand subtraction as an unknown-addend problem", orderInStrand: 4 },
  { subject: "MATH", strand: "operations", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.OA.C.6", name: "Fluency within 10", description: "Add and subtract within 10 fluently", orderInStrand: 5 },
  
  // Grade 1 Math - Place Value
  { subject: "MATH", strand: "place_value", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.NBT.B.2", name: "Tens and Ones", description: "Understand that two-digit numbers are composed of tens and ones", orderInStrand: 1 },
  { subject: "MATH", strand: "place_value", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.NBT.B.3", name: "Compare Two-Digit Numbers", description: "Compare two-digit numbers using >, =, < symbols", orderInStrand: 2 },
  { subject: "MATH", strand: "place_value", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.NBT.C.4", name: "Add within 100", description: "Add within 100, including two-digit and one-digit numbers", orderInStrand: 3 },
  
  // Grade 1 Math - Measurement
  { subject: "MATH", strand: "measurement", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.MD.A.1", name: "Order by Length", description: "Order three objects by length and compare lengths", orderInStrand: 1 },
  { subject: "MATH", strand: "measurement", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.MD.A.2", name: "Measure with Units", description: "Measure length using same-size units with no gaps or overlaps", orderInStrand: 2 },
  { subject: "MATH", strand: "measurement", gradeLevel: "1", standardCode: "CCSS.MATH.CONTENT.1.MD.B.3", name: "Tell Time to Hour", description: "Tell and write time in hours and half-hours", orderInStrand: 3 },
  
  // Grade 2 Math - Operations
  { subject: "MATH", strand: "operations", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.OA.A.1", name: "Two-Step Word Problems", description: "Use addition and subtraction within 100 to solve one and two-step word problems", orderInStrand: 1 },
  { subject: "MATH", strand: "operations", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.OA.B.2", name: "Fluency within 20", description: "Fluently add and subtract within 20 using mental strategies", orderInStrand: 2 },
  { subject: "MATH", strand: "operations", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.OA.C.3", name: "Odd and Even", description: "Determine whether a group of objects is odd or even", orderInStrand: 3 },
  { subject: "MATH", strand: "operations", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.OA.C.4", name: "Arrays and Repeated Addition", description: "Use addition to find total number in rectangular arrays", orderInStrand: 4 },
  
  // Grade 2 Math - Place Value
  { subject: "MATH", strand: "place_value", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.NBT.A.1", name: "Hundreds, Tens, Ones", description: "Understand that 100 can be thought of as 10 tens", orderInStrand: 1 },
  { subject: "MATH", strand: "place_value", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.NBT.A.3", name: "Read and Write to 1000", description: "Read and write numbers to 1000 using numerals and number names", orderInStrand: 2 },
  { subject: "MATH", strand: "place_value", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.NBT.B.5", name: "Fluently Add within 100", description: "Fluently add and subtract within 100 using place value strategies", orderInStrand: 3 },
  { subject: "MATH", strand: "place_value", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.NBT.B.7", name: "Add and Subtract within 1000", description: "Add and subtract within 1000 using place value understanding", orderInStrand: 4 },
  
  // Grade 2 Math - Measurement
  { subject: "MATH", strand: "measurement", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.MD.A.1", name: "Measure with Standard Units", description: "Measure length using appropriate tools (rulers, yardsticks)", orderInStrand: 1 },
  { subject: "MATH", strand: "measurement", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.MD.B.5", name: "Word Problems with Length", description: "Use addition and subtraction within 100 to solve word problems involving length", orderInStrand: 2 },
  { subject: "MATH", strand: "measurement", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.MD.C.7", name: "Tell Time to 5 Minutes", description: "Tell and write time to the nearest 5 minutes using analog and digital clocks", orderInStrand: 3 },
  { subject: "MATH", strand: "measurement", gradeLevel: "2", standardCode: "CCSS.MATH.CONTENT.2.MD.C.8", name: "Money Skills", description: "Solve word problems involving dollar bills, quarters, dimes, nickels, and pennies", orderInStrand: 4 },

  // ============================================
  // SCIENCE SKILLS (NGSS-aligned)
  // ============================================
  
  // Kindergarten Science - Life Science
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "K", standardCode: "K-LS1-1", name: "Living Things Need", description: "Observe and describe what plants and animals need to survive", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "K", standardCode: "K-ESS3-1", name: "Humans Use Resources", description: "Observe how humans use natural resources to meet their needs", orderInStrand: 2 },
  
  // Kindergarten Science - Earth Science
  { subject: "SCIENCE", strand: "earth_science", gradeLevel: "K", standardCode: "K-ESS2-1", name: "Weather Patterns", description: "Observe and describe local weather conditions", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "earth_science", gradeLevel: "K", standardCode: "K-ESS2-2", name: "Severe Weather", description: "Discuss how to prepare for different types of weather", orderInStrand: 2 },
  
  // Kindergarten Science - Physical Science
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "K", standardCode: "K-PS2-1", name: "Push and Pull", description: "Explore how pushes and pulls can change motion of objects", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "K", standardCode: "K-PS2-2", name: "Motion Prediction", description: "Observe and predict how objects move in different ways", orderInStrand: 2 },
  
  // Kindergarten Science - Inquiry
  { subject: "SCIENCE", strand: "inquiry", gradeLevel: "K", standardCode: "K-SEP-1", name: "Ask Questions", description: "Ask questions based on observations about the natural world", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "inquiry", gradeLevel: "K", standardCode: "K-SEP-3", name: "Make Observations", description: "Use senses to gather information about objects and events", orderInStrand: 2 },
  
  // Grade 1 Science - Life Science
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "1", standardCode: "1-LS1-1", name: "Parent and Offspring", description: "Observe how young animals are similar to but not exactly like their parents", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "1", standardCode: "1-LS1-2", name: "Animal Behaviors", description: "Observe animal behaviors that help offspring survive", orderInStrand: 2 },
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "1", standardCode: "1-LS3-1", name: "Inherited Traits", description: "Observe patterns in traits that animals inherit from parents", orderInStrand: 3 },
  
  // Grade 1 Science - Earth Science
  { subject: "SCIENCE", strand: "earth_science", gradeLevel: "1", standardCode: "1-ESS1-1", name: "Sun and Moon Patterns", description: "Observe predictable patterns of the sun and moon in the sky", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "earth_science", gradeLevel: "1", standardCode: "1-ESS1-2", name: "Daylight Changes", description: "Observe how the amount of daylight changes throughout the year", orderInStrand: 2 },
  
  // Grade 1 Science - Physical Science
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "1", standardCode: "1-PS4-1", name: "Sound Vibrations", description: "Observe that vibrating materials make sounds", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "1", standardCode: "1-PS4-2", name: "Light and Materials", description: "Explore how materials block, reflect, or let light through", orderInStrand: 2 },
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "1", standardCode: "1-PS4-3", name: "Communication with Light/Sound", description: "Explore devices that communicate with light or sound", orderInStrand: 3 },
  
  // Grade 1 Science - Inquiry
  { subject: "SCIENCE", strand: "inquiry", gradeLevel: "1", standardCode: "1-SEP-2", name: "Simple Investigations", description: "Plan and carry out simple investigations with guidance", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "inquiry", gradeLevel: "1", standardCode: "1-SEP-4", name: "Analyze Data", description: "Use observations and data to answer questions", orderInStrand: 2 },
  
  // Grade 2 Science - Life Science
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "2", standardCode: "2-LS2-1", name: "Plant Growth", description: "Observe that plants need water and light to grow", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "2", standardCode: "2-LS2-2", name: "Seed Dispersal", description: "Explore how seeds are dispersed to grow new plants", orderInStrand: 2 },
  { subject: "SCIENCE", strand: "life_science", gradeLevel: "2", standardCode: "2-LS4-1", name: "Habitats", description: "Observe the diversity of life in different habitats", orderInStrand: 3 },
  
  // Grade 2 Science - Earth Science
  { subject: "SCIENCE", strand: "earth_science", gradeLevel: "2", standardCode: "2-ESS1-1", name: "Earth Changes", description: "Observe that water and wind change the shape of land", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "earth_science", gradeLevel: "2", standardCode: "2-ESS2-1", name: "Land and Water", description: "Compare different kinds of land and bodies of water", orderInStrand: 2 },
  { subject: "SCIENCE", strand: "earth_science", gradeLevel: "2", standardCode: "2-ESS2-2", name: "Mapping Land and Water", description: "Use maps to identify land and water features", orderInStrand: 3 },
  
  // Grade 2 Science - Physical Science
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "2", standardCode: "2-PS1-1", name: "Material Properties", description: "Classify materials by observable properties", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "2", standardCode: "2-PS1-2", name: "Testing Materials", description: "Test different materials to determine best use", orderInStrand: 2 },
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "2", standardCode: "2-PS1-3", name: "Heating and Cooling", description: "Observe changes in materials when heated or cooled", orderInStrand: 3 },
  { subject: "SCIENCE", strand: "physical_science", gradeLevel: "2", standardCode: "2-PS1-4", name: "Reversible Changes", description: "Explore which changes to materials can be reversed", orderInStrand: 4 },
  
  // Grade 2 Science - Inquiry
  { subject: "SCIENCE", strand: "inquiry", gradeLevel: "2", standardCode: "2-SEP-5", name: "Use Math in Science", description: "Use counting and numbers to describe observations", orderInStrand: 1 },
  { subject: "SCIENCE", strand: "inquiry", gradeLevel: "2", standardCode: "2-SEP-6", name: "Simple Explanations", description: "Construct explanations based on evidence from observations", orderInStrand: 2 },

  // ============================================
  // CHARACTER SKILLS (Christian Virtues)
  // ============================================
  
  // Kindergarten Character - Love & Kindness
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "K", name: "Showing Kindness", description: "Demonstrate kind words and actions toward others", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "K", name: "Sharing with Others", description: "Practice sharing toys and materials with friends", orderInStrand: 2 },
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "K", name: "Helping at Home", description: "Show love by helping family with simple tasks", orderInStrand: 3 },
  
  // Kindergarten Character - Obedience & Respect
  { subject: "CHARACTER", strand: "obedience_respect", gradeLevel: "K", name: "Following Instructions", description: "Listen to and follow simple directions", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "obedience_respect", gradeLevel: "K", name: "Respecting Adults", description: "Show respect to parents, teachers, and other adults", orderInStrand: 2 },
  
  // Kindergarten Character - Thankfulness
  { subject: "CHARACTER", strand: "thankfulness", gradeLevel: "K", name: "Saying Thank You", description: "Express gratitude with words and actions", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "thankfulness", gradeLevel: "K", name: "Thankful Heart", description: "Recognize blessings and gifts from God", orderInStrand: 2 },
  
  // Kindergarten Character - Honesty
  { subject: "CHARACTER", strand: "honesty_truth", gradeLevel: "K", name: "Telling the Truth", description: "Speak honestly even when it's difficult", orderInStrand: 1 },
  
  // Grade 1 Character - Love & Kindness
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "1", name: "Compassion for Others", description: "Show care when others are sad or hurt", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "1", name: "Including Others", description: "Welcome and include others in play and activities", orderInStrand: 2 },
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "1", name: "Encouraging Words", description: "Use words that build others up and encourage them", orderInStrand: 3 },
  
  // Grade 1 Character - Self-Control
  { subject: "CHARACTER", strand: "self_control", gradeLevel: "1", name: "Patience", description: "Wait calmly for turns and special events", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "self_control", gradeLevel: "1", name: "Managing Emotions", description: "Express feelings appropriately without outbursts", orderInStrand: 2 },
  { subject: "CHARACTER", strand: "self_control", gradeLevel: "1", name: "Thinking Before Acting", description: "Pause and think before making choices", orderInStrand: 3 },
  
  // Grade 1 Character - Responsibility
  { subject: "CHARACTER", strand: "responsibility", gradeLevel: "1", name: "Caring for Belongings", description: "Take care of personal items and shared materials", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "responsibility", gradeLevel: "1", name: "Completing Tasks", description: "Finish work and chores without reminders", orderInStrand: 2 },
  
  // Grade 1 Character - Honesty
  { subject: "CHARACTER", strand: "honesty_truth", gradeLevel: "1", name: "Admitting Mistakes", description: "Own up to mistakes and say sorry sincerely", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "honesty_truth", gradeLevel: "1", name: "Keeping Promises", description: "Follow through on what you say you will do", orderInStrand: 2 },
  
  // Grade 2 Character - Love & Kindness
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "2", name: "Serving Others", description: "Look for ways to help and serve those in need", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "2", name: "Forgiving Others", description: "Choose to forgive when others hurt us", orderInStrand: 2 },
  { subject: "CHARACTER", strand: "love_kindness", gradeLevel: "2", name: "Standing Up for Others", description: "Defend and support those who are treated unfairly", orderInStrand: 3 },
  
  // Grade 2 Character - Courage
  { subject: "CHARACTER", strand: "courage", gradeLevel: "2", name: "Trying New Things", description: "Step out of comfort zone with God's help", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "courage", gradeLevel: "2", name: "Standing for Truth", description: "Do the right thing even when it's hard", orderInStrand: 2 },
  { subject: "CHARACTER", strand: "courage", gradeLevel: "2", name: "Facing Fears", description: "Trust God when feeling afraid", orderInStrand: 3 },
  
  // Grade 2 Character - Perseverance
  { subject: "CHARACTER", strand: "perseverance", gradeLevel: "2", name: "Not Giving Up", description: "Keep trying even when things are difficult", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "perseverance", gradeLevel: "2", name: "Learning from Mistakes", description: "Use mistakes as opportunities to grow", orderInStrand: 2 },
  
  // Grade 2 Character - Humility
  { subject: "CHARACTER", strand: "humility", gradeLevel: "2", name: "Celebrating Others", description: "Be happy for others' successes without jealousy", orderInStrand: 1 },
  { subject: "CHARACTER", strand: "humility", gradeLevel: "2", name: "Accepting Help", description: "Receive help and correction gracefully", orderInStrand: 2 },
];

export async function seedSkills(): Promise<void> {
  console.log("Checking if skills need to be seeded...");

  const existingSkills = await db.select().from(skills);
  if (existingSkills.length === 0) {
    console.log(`Seeding ${K2_SKILLS.length} K-2 curriculum skills...`);
    for (const skill of K2_SKILLS) {
      await db.insert(skills).values({
        subject: skill.subject,
        strand: skill.strand,
        gradeLevel: skill.gradeLevel,
        standardCode: skill.standardCode,
        name: skill.name,
        description: skill.description,
        orderInStrand: skill.orderInStrand,
        prerequisiteSkillIds: [],
      });
    }
    console.log("Successfully seeded K-2 curriculum skills!");
  } else {
    console.log(`Skills table already has ${existingSkills.length} skills. Skipping legacy seed.`);
  }

  // Always run the V2 skill seed (idempotent — only inserts what's missing). This
  // adds per-digraph skills + sight-word skill so the V2 reading templates link to
  // real rows and the daily-queue engine can pick them.
  try {
    const { seedV2Skills } = await import("./seedSkillsV2");
    const { inserted, skipped } = await seedV2Skills();
    console.log(`V2 reading skills: inserted=${inserted}, skipped=${skipped}`);
  } catch (err) {
    console.error("Failed to seed V2 reading skills:", err);
  }
}
