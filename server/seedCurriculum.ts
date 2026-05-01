import { db } from "./db";
import { 
  curriculumStrands, 
  yearEndGoals, 
  milestones, 
  skills, 
  skillEdges 
} from "@shared/schema";
import { sql, eq } from "drizzle-orm";

type StrandDef = {
  subject: string;
  grade: string;
  name: string;
  description: string;
  orderInSubject: number;
  estimatedWeeks: number;
};

type SkillDef = {
  subject: string;
  strand: string;
  gradeLevel: string;
  name: string;
  description: string;
  orderInStrand: number;
  standardCode?: string;
  difficultyBand: string;
  estimatedLessons: number;
};

type GoalDef = {
  subject: string;
  grade: string;
  title: string;
  description: string;
  standardCode?: string;
  orderInSubject: number;
};

// ============================================
// MATH CURRICULUM - K-5 Progression
// ============================================

const mathStrands: StrandDef[] = [
  // Kindergarten
  { subject: "MATH", grade: "K", name: "Counting & Cardinality", description: "Count to 100, understand quantity and number relationships", orderInSubject: 1, estimatedWeeks: 12 },
  { subject: "MATH", grade: "K", name: "Operations & Algebraic Thinking", description: "Understand addition and subtraction within 10", orderInSubject: 2, estimatedWeeks: 10 },
  { subject: "MATH", grade: "K", name: "Number Relationships", description: "Compare numbers, understand more/less/equal", orderInSubject: 3, estimatedWeeks: 8 },
  { subject: "MATH", grade: "K", name: "Geometry & Measurement", description: "Identify shapes, compare sizes", orderInSubject: 4, estimatedWeeks: 6 },
  
  // Grade 1
  { subject: "MATH", grade: "1", name: "Addition & Subtraction within 20", description: "Master addition and subtraction facts within 20", orderInSubject: 1, estimatedWeeks: 14 },
  { subject: "MATH", grade: "1", name: "Place Value", description: "Understand tens and ones", orderInSubject: 2, estimatedWeeks: 8 },
  { subject: "MATH", grade: "1", name: "Measurement & Data", description: "Measure length, tell time, organize data", orderInSubject: 3, estimatedWeeks: 8 },
  { subject: "MATH", grade: "1", name: "Geometry", description: "Compose and partition shapes", orderInSubject: 4, estimatedWeeks: 6 },
  
  // Grade 2
  { subject: "MATH", grade: "2", name: "Addition & Subtraction within 100", description: "Fluently add and subtract within 100", orderInSubject: 1, estimatedWeeks: 12 },
  { subject: "MATH", grade: "2", name: "Place Value to 1000", description: "Understand hundreds, tens, and ones", orderInSubject: 2, estimatedWeeks: 8 },
  { subject: "MATH", grade: "2", name: "Foundations for Multiplication", description: "Work with equal groups and arrays", orderInSubject: 3, estimatedWeeks: 8 },
  { subject: "MATH", grade: "2", name: "Measurement & Geometry", description: "Measure length, tell time, work with money, identify shapes", orderInSubject: 4, estimatedWeeks: 8 },
  
  // Grade 3
  { subject: "MATH", grade: "3", name: "Multiplication & Division", description: "Master multiplication and division facts within 100", orderInSubject: 1, estimatedWeeks: 14 },
  { subject: "MATH", grade: "3", name: "Fractions", description: "Understand fractions as numbers", orderInSubject: 2, estimatedWeeks: 10 },
  { subject: "MATH", grade: "3", name: "Multi-digit Arithmetic", description: "Add and subtract within 1000", orderInSubject: 3, estimatedWeeks: 8 },
  { subject: "MATH", grade: "3", name: "Area & Perimeter", description: "Calculate area and perimeter of rectangles", orderInSubject: 4, estimatedWeeks: 6 },
  
  // Grade 4
  { subject: "MATH", grade: "4", name: "Multi-digit Operations", description: "Multiply and divide multi-digit numbers", orderInSubject: 1, estimatedWeeks: 12 },
  { subject: "MATH", grade: "4", name: "Fractions & Decimals", description: "Extend fraction understanding, introduce decimals", orderInSubject: 2, estimatedWeeks: 12 },
  { subject: "MATH", grade: "4", name: "Factors & Multiples", description: "Find factor pairs and multiples", orderInSubject: 3, estimatedWeeks: 6 },
  { subject: "MATH", grade: "4", name: "Geometry & Measurement", description: "Classify shapes, measure angles, convert units", orderInSubject: 4, estimatedWeeks: 8 },
  
  // Grade 5
  { subject: "MATH", grade: "5", name: "Decimal Operations", description: "Perform operations with decimals", orderInSubject: 1, estimatedWeeks: 10 },
  { subject: "MATH", grade: "5", name: "Fraction Operations", description: "Add, subtract, multiply, and divide fractions", orderInSubject: 2, estimatedWeeks: 12 },
  { subject: "MATH", grade: "5", name: "Volume & Coordinate Planes", description: "Calculate volume, graph on coordinate planes", orderInSubject: 3, estimatedWeeks: 8 },
  { subject: "MATH", grade: "5", name: "Algebraic Thinking", description: "Write and evaluate expressions, understand patterns", orderInSubject: 4, estimatedWeeks: 8 },
];

const mathSkills: SkillDef[] = [
  // ============================================
  // KINDERGARTEN MATH SKILLS
  // ============================================
  
  // Kindergarten - Counting & Cardinality
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Count to 10", description: "Count forward from 1 to 10", orderInStrand: 1, standardCode: "CCSS.MATH.K.CC.A.1", difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Count to 20", description: "Count forward from 1 to 20", orderInStrand: 2, standardCode: "CCSS.MATH.K.CC.A.1", difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Count to 50", description: "Count forward from 1 to 50", orderInStrand: 3, standardCode: "CCSS.MATH.K.CC.A.1", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Count to 100", description: "Count forward from 1 to 100", orderInStrand: 4, standardCode: "CCSS.MATH.K.CC.A.1", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Count Objects to 10", description: "Count objects up to 10 with one-to-one correspondence", orderInStrand: 5, standardCode: "CCSS.MATH.K.CC.B.4", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Count Objects to 20", description: "Count objects up to 20 with one-to-one correspondence", orderInStrand: 6, standardCode: "CCSS.MATH.K.CC.B.4", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Write Numbers 0-10", description: "Write numbers from 0 to 10", orderInStrand: 7, standardCode: "CCSS.MATH.K.CC.A.3", difficultyBand: "easy", estimatedLessons: 5 },
  { subject: "MATH", strand: "Counting & Cardinality", gradeLevel: "K", name: "Write Numbers 11-20", description: "Write numbers from 11 to 20", orderInStrand: 8, standardCode: "CCSS.MATH.K.CC.A.3", difficultyBand: "medium", estimatedLessons: 4 },
  
  // Kindergarten - Operations & Algebraic Thinking
  { subject: "MATH", strand: "Operations & Algebraic Thinking", gradeLevel: "K", name: "Addition within 5", description: "Add numbers to make sums up to 5", orderInStrand: 1, standardCode: "CCSS.MATH.K.OA.A.1", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Operations & Algebraic Thinking", gradeLevel: "K", name: "Subtraction within 5", description: "Subtract numbers within 5", orderInStrand: 2, standardCode: "CCSS.MATH.K.OA.A.1", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Operations & Algebraic Thinking", gradeLevel: "K", name: "Addition within 10", description: "Add numbers to make sums up to 10", orderInStrand: 3, standardCode: "CCSS.MATH.K.OA.A.2", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Operations & Algebraic Thinking", gradeLevel: "K", name: "Subtraction within 10", description: "Subtract numbers within 10", orderInStrand: 4, standardCode: "CCSS.MATH.K.OA.A.2", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Operations & Algebraic Thinking", gradeLevel: "K", name: "Ways to Make 10", description: "Find all pairs of numbers that make 10", orderInStrand: 5, standardCode: "CCSS.MATH.K.OA.A.4", difficultyBand: "medium", estimatedLessons: 4 },
  
  // Kindergarten - Number Relationships
  { subject: "MATH", strand: "Number Relationships", gradeLevel: "K", name: "Compare Numbers to 10", description: "Compare two numbers within 10", orderInStrand: 1, standardCode: "CCSS.MATH.K.CC.C.6", difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "MATH", strand: "Number Relationships", gradeLevel: "K", name: "More and Less", description: "Identify which group has more or less", orderInStrand: 2, standardCode: "CCSS.MATH.K.CC.C.6", difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "MATH", strand: "Number Relationships", gradeLevel: "K", name: "One More One Less", description: "Find one more and one less than a number", orderInStrand: 3, standardCode: "CCSS.MATH.K.CC.C.4", difficultyBand: "medium", estimatedLessons: 4 },
  
  // Kindergarten - Geometry & Measurement
  { subject: "MATH", strand: "Geometry & Measurement", gradeLevel: "K", name: "Identify 2D Shapes", description: "Name and identify circles, squares, triangles, rectangles", orderInStrand: 1, standardCode: "CCSS.MATH.K.G.A.2", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Geometry & Measurement", gradeLevel: "K", name: "Identify 3D Shapes", description: "Name and identify cubes, cones, cylinders, spheres", orderInStrand: 2, standardCode: "CCSS.MATH.K.G.A.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Geometry & Measurement", gradeLevel: "K", name: "Compare Sizes", description: "Compare objects by length, height, and weight", orderInStrand: 3, standardCode: "CCSS.MATH.K.MD.A.2", difficultyBand: "easy", estimatedLessons: 3 },
  
  // ============================================
  // GRADE 1 MATH SKILLS
  // ============================================
  
  // Grade 1 - Addition & Subtraction within 20
  { subject: "MATH", strand: "Addition & Subtraction within 20", gradeLevel: "1", name: "Addition within 10 Fluency", description: "Fluently add within 10", orderInStrand: 1, standardCode: "CCSS.MATH.1.OA.C.6", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Addition & Subtraction within 20", gradeLevel: "1", name: "Subtraction within 10 Fluency", description: "Fluently subtract within 10", orderInStrand: 2, standardCode: "CCSS.MATH.1.OA.C.6", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Addition & Subtraction within 20", gradeLevel: "1", name: "Addition within 20", description: "Add numbers to make sums up to 20", orderInStrand: 3, standardCode: "CCSS.MATH.1.OA.C.6", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Addition & Subtraction within 20", gradeLevel: "1", name: "Subtraction within 20", description: "Subtract numbers within 20", orderInStrand: 4, standardCode: "CCSS.MATH.1.OA.C.6", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Addition & Subtraction within 20", gradeLevel: "1", name: "Missing Addend Problems", description: "Solve problems like 8 + ? = 14", orderInStrand: 5, standardCode: "CCSS.MATH.1.OA.D.8", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "MATH", strand: "Addition & Subtraction within 20", gradeLevel: "1", name: "Word Problems within 20", description: "Solve addition and subtraction word problems", orderInStrand: 6, standardCode: "CCSS.MATH.1.OA.A.1", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 1 - Place Value
  { subject: "MATH", strand: "Place Value", gradeLevel: "1", name: "Tens and Ones", description: "Understand that 10 ones make a ten", orderInStrand: 1, standardCode: "CCSS.MATH.1.NBT.B.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Place Value", gradeLevel: "1", name: "Count to 120", description: "Count to 120 starting at any number", orderInStrand: 2, standardCode: "CCSS.MATH.1.NBT.A.1", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Place Value", gradeLevel: "1", name: "Compare Two-Digit Numbers", description: "Compare two two-digit numbers using symbols", orderInStrand: 3, standardCode: "CCSS.MATH.1.NBT.B.3", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "MATH", strand: "Place Value", gradeLevel: "1", name: "Add Tens", description: "Add multiples of 10 mentally", orderInStrand: 4, standardCode: "CCSS.MATH.1.NBT.C.4", difficultyBand: "medium", estimatedLessons: 3 },
  
  // Grade 1 - Measurement & Data
  { subject: "MATH", strand: "Measurement & Data", gradeLevel: "1", name: "Measure Length", description: "Measure lengths using non-standard units", orderInStrand: 1, standardCode: "CCSS.MATH.1.MD.A.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Measurement & Data", gradeLevel: "1", name: "Tell Time to Hour", description: "Tell time to the hour on analog clocks", orderInStrand: 2, standardCode: "CCSS.MATH.1.MD.B.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Measurement & Data", gradeLevel: "1", name: "Tell Time to Half Hour", description: "Tell time to the half hour", orderInStrand: 3, standardCode: "CCSS.MATH.1.MD.B.3", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "MATH", strand: "Measurement & Data", gradeLevel: "1", name: "Organize Data", description: "Organize and represent data with up to three categories", orderInStrand: 4, standardCode: "CCSS.MATH.1.MD.C.4", difficultyBand: "medium", estimatedLessons: 3 },
  
  // Grade 1 - Geometry
  { subject: "MATH", strand: "Geometry", gradeLevel: "1", name: "Defining Attributes of Shapes", description: "Distinguish defining attributes of shapes", orderInStrand: 1, standardCode: "CCSS.MATH.1.G.A.1", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Geometry", gradeLevel: "1", name: "Compose Shapes", description: "Compose two-dimensional and three-dimensional shapes", orderInStrand: 2, standardCode: "CCSS.MATH.1.G.A.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Geometry", gradeLevel: "1", name: "Partition Shapes", description: "Partition circles and rectangles into halves and fourths", orderInStrand: 3, standardCode: "CCSS.MATH.1.G.A.3", difficultyBand: "hard", estimatedLessons: 4 },
  
  // ============================================
  // GRADE 2 MATH SKILLS
  // ============================================
  
  // Grade 2 - Addition & Subtraction within 100
  { subject: "MATH", strand: "Addition & Subtraction within 100", gradeLevel: "2", name: "Add Two-Digit Numbers", description: "Add two-digit numbers with regrouping", orderInStrand: 1, standardCode: "CCSS.MATH.2.NBT.B.5", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Addition & Subtraction within 100", gradeLevel: "2", name: "Subtract Two-Digit Numbers", description: "Subtract two-digit numbers with regrouping", orderInStrand: 2, standardCode: "CCSS.MATH.2.NBT.B.5", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Addition & Subtraction within 100", gradeLevel: "2", name: "Fluency within 100", description: "Fluently add and subtract within 100", orderInStrand: 3, standardCode: "CCSS.MATH.2.NBT.B.5", difficultyBand: "hard", estimatedLessons: 6 },
  { subject: "MATH", strand: "Addition & Subtraction within 100", gradeLevel: "2", name: "Word Problems Two-Step", description: "Solve two-step word problems within 100", orderInStrand: 4, standardCode: "CCSS.MATH.2.OA.A.1", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 2 - Place Value to 1000
  { subject: "MATH", strand: "Place Value to 1000", gradeLevel: "2", name: "Hundreds Tens Ones", description: "Understand three-digit place value", orderInStrand: 1, standardCode: "CCSS.MATH.2.NBT.A.1", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Place Value to 1000", gradeLevel: "2", name: "Count to 1000", description: "Count within 1000 by 1s, 5s, 10s, and 100s", orderInStrand: 2, standardCode: "CCSS.MATH.2.NBT.A.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Place Value to 1000", gradeLevel: "2", name: "Read Write Numbers to 1000", description: "Read and write numbers to 1000", orderInStrand: 3, standardCode: "CCSS.MATH.2.NBT.A.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Place Value to 1000", gradeLevel: "2", name: "Compare Three-Digit Numbers", description: "Compare three-digit numbers using symbols", orderInStrand: 4, standardCode: "CCSS.MATH.2.NBT.A.4", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 2 - Foundations for Multiplication
  { subject: "MATH", strand: "Foundations for Multiplication", gradeLevel: "2", name: "Equal Groups", description: "Identify and create equal groups", orderInStrand: 1, standardCode: "CCSS.MATH.2.OA.C.4", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Foundations for Multiplication", gradeLevel: "2", name: "Arrays", description: "Arrange objects in rows and columns", orderInStrand: 2, standardCode: "CCSS.MATH.2.OA.C.4", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Foundations for Multiplication", gradeLevel: "2", name: "Repeated Addition", description: "Use repeated addition to find totals", orderInStrand: 3, standardCode: "CCSS.MATH.2.OA.C.4", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Foundations for Multiplication", gradeLevel: "2", name: "Odd and Even", description: "Determine whether numbers are odd or even", orderInStrand: 4, standardCode: "CCSS.MATH.2.OA.C.3", difficultyBand: "easy", estimatedLessons: 3 },
  
  // Grade 2 - Measurement & Geometry
  { subject: "MATH", strand: "Measurement & Geometry", gradeLevel: "2", name: "Measure with Standard Units", description: "Measure lengths using rulers in inches and centimeters", orderInStrand: 1, standardCode: "CCSS.MATH.2.MD.A.1", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Measurement & Geometry", gradeLevel: "2", name: "Tell Time to 5 Minutes", description: "Tell time to the nearest 5 minutes", orderInStrand: 2, standardCode: "CCSS.MATH.2.MD.C.7", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Measurement & Geometry", gradeLevel: "2", name: "Count Money", description: "Count collections of coins and bills", orderInStrand: 3, standardCode: "CCSS.MATH.2.MD.C.8", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Measurement & Geometry", gradeLevel: "2", name: "Identify Quadrilaterals", description: "Recognize and draw shapes with specific attributes", orderInStrand: 4, standardCode: "CCSS.MATH.2.G.A.1", difficultyBand: "medium", estimatedLessons: 3 },
  
  // ============================================
  // GRADE 3 MATH SKILLS
  // ============================================
  
  // Grade 3 - Multiplication & Division
  { subject: "MATH", strand: "Multiplication & Division", gradeLevel: "3", name: "Multiplication Concept", description: "Understand multiplication as equal groups", orderInStrand: 1, standardCode: "CCSS.MATH.3.OA.A.1", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "MATH", strand: "Multiplication & Division", gradeLevel: "3", name: "Multiply by 2, 5, 10", description: "Master multiplication facts for 2, 5, and 10", orderInStrand: 2, standardCode: "CCSS.MATH.3.OA.C.7", difficultyBand: "easy", estimatedLessons: 5 },
  { subject: "MATH", strand: "Multiplication & Division", gradeLevel: "3", name: "Multiply by 3, 4, 6", description: "Master multiplication facts for 3, 4, and 6", orderInStrand: 3, standardCode: "CCSS.MATH.3.OA.C.7", difficultyBand: "medium", estimatedLessons: 6 },
  { subject: "MATH", strand: "Multiplication & Division", gradeLevel: "3", name: "Multiply by 7, 8, 9", description: "Master multiplication facts for 7, 8, and 9", orderInStrand: 4, standardCode: "CCSS.MATH.3.OA.C.7", difficultyBand: "hard", estimatedLessons: 6 },
  { subject: "MATH", strand: "Multiplication & Division", gradeLevel: "3", name: "Division Concept", description: "Understand division as sharing equally", orderInStrand: 5, standardCode: "CCSS.MATH.3.OA.A.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Multiplication & Division", gradeLevel: "3", name: "Division Facts within 100", description: "Master division facts within 100", orderInStrand: 6, standardCode: "CCSS.MATH.3.OA.C.7", difficultyBand: "hard", estimatedLessons: 6 },
  { subject: "MATH", strand: "Multiplication & Division", gradeLevel: "3", name: "Word Problems Multiply Divide", description: "Solve multiplication and division word problems", orderInStrand: 7, standardCode: "CCSS.MATH.3.OA.A.3", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 3 - Fractions
  { subject: "MATH", strand: "Fractions", gradeLevel: "3", name: "Understand Fractions", description: "Understand fractions as parts of a whole", orderInStrand: 1, standardCode: "CCSS.MATH.3.NF.A.1", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fractions", gradeLevel: "3", name: "Fractions on Number Line", description: "Represent fractions on a number line", orderInStrand: 2, standardCode: "CCSS.MATH.3.NF.A.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Fractions", gradeLevel: "3", name: "Equivalent Fractions", description: "Recognize and generate equivalent fractions", orderInStrand: 3, standardCode: "CCSS.MATH.3.NF.A.3", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fractions", gradeLevel: "3", name: "Compare Fractions", description: "Compare fractions with same numerator or denominator", orderInStrand: 4, standardCode: "CCSS.MATH.3.NF.A.3", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 3 - Multi-digit Arithmetic
  { subject: "MATH", strand: "Multi-digit Arithmetic", gradeLevel: "3", name: "Add within 1000", description: "Fluently add within 1000", orderInStrand: 1, standardCode: "CCSS.MATH.3.NBT.A.2", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Multi-digit Arithmetic", gradeLevel: "3", name: "Subtract within 1000", description: "Fluently subtract within 1000", orderInStrand: 2, standardCode: "CCSS.MATH.3.NBT.A.2", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Multi-digit Arithmetic", gradeLevel: "3", name: "Multiply by Multiples of 10", description: "Multiply one-digit numbers by multiples of 10", orderInStrand: 3, standardCode: "CCSS.MATH.3.NBT.A.3", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 3 - Area & Perimeter
  { subject: "MATH", strand: "Area & Perimeter", gradeLevel: "3", name: "Understand Area", description: "Measure area by counting unit squares", orderInStrand: 1, standardCode: "CCSS.MATH.3.MD.C.5", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Area & Perimeter", gradeLevel: "3", name: "Area of Rectangles", description: "Calculate area of rectangles by multiplying", orderInStrand: 2, standardCode: "CCSS.MATH.3.MD.C.7", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Area & Perimeter", gradeLevel: "3", name: "Understand Perimeter", description: "Find perimeter of polygons", orderInStrand: 3, standardCode: "CCSS.MATH.3.MD.D.8", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Area & Perimeter", gradeLevel: "3", name: "Area and Perimeter Problems", description: "Solve real-world area and perimeter problems", orderInStrand: 4, standardCode: "CCSS.MATH.3.MD.D.8", difficultyBand: "hard", estimatedLessons: 5 },
  
  // ============================================
  // GRADE 4 MATH SKILLS
  // ============================================
  
  // Grade 4 - Multi-digit Operations
  { subject: "MATH", strand: "Multi-digit Operations", gradeLevel: "4", name: "Multiply by One-Digit", description: "Multiply up to 4-digit numbers by one-digit numbers", orderInStrand: 1, standardCode: "CCSS.MATH.4.NBT.B.5", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "MATH", strand: "Multi-digit Operations", gradeLevel: "4", name: "Multiply Two-Digit by Two-Digit", description: "Multiply two-digit numbers together", orderInStrand: 2, standardCode: "CCSS.MATH.4.NBT.B.5", difficultyBand: "hard", estimatedLessons: 6 },
  { subject: "MATH", strand: "Multi-digit Operations", gradeLevel: "4", name: "Divide by One-Digit", description: "Divide up to 4-digit dividends by one-digit divisors", orderInStrand: 3, standardCode: "CCSS.MATH.4.NBT.B.6", difficultyBand: "hard", estimatedLessons: 6 },
  { subject: "MATH", strand: "Multi-digit Operations", gradeLevel: "4", name: "Division with Remainders", description: "Interpret remainders in division problems", orderInStrand: 4, standardCode: "CCSS.MATH.4.OA.A.3", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 4 - Fractions & Decimals
  { subject: "MATH", strand: "Fractions & Decimals", gradeLevel: "4", name: "Equivalent Fractions Advanced", description: "Generate equivalent fractions using multiplication", orderInStrand: 1, standardCode: "CCSS.MATH.4.NF.A.1", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Fractions & Decimals", gradeLevel: "4", name: "Compare Fractions", description: "Compare fractions with different denominators", orderInStrand: 2, standardCode: "CCSS.MATH.4.NF.A.2", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fractions & Decimals", gradeLevel: "4", name: "Add Fractions Same Denominator", description: "Add fractions with the same denominator", orderInStrand: 3, standardCode: "CCSS.MATH.4.NF.B.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Fractions & Decimals", gradeLevel: "4", name: "Subtract Fractions Same Denominator", description: "Subtract fractions with the same denominator", orderInStrand: 4, standardCode: "CCSS.MATH.4.NF.B.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Fractions & Decimals", gradeLevel: "4", name: "Multiply Fraction by Whole Number", description: "Multiply a fraction by a whole number", orderInStrand: 5, standardCode: "CCSS.MATH.4.NF.B.4", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fractions & Decimals", gradeLevel: "4", name: "Understand Decimals", description: "Understand decimal notation for fractions", orderInStrand: 6, standardCode: "CCSS.MATH.4.NF.C.6", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Fractions & Decimals", gradeLevel: "4", name: "Compare Decimals", description: "Compare two decimals to hundredths", orderInStrand: 7, standardCode: "CCSS.MATH.4.NF.C.7", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 4 - Factors & Multiples
  { subject: "MATH", strand: "Factors & Multiples", gradeLevel: "4", name: "Find Factor Pairs", description: "Find all factor pairs for numbers 1-100", orderInStrand: 1, standardCode: "CCSS.MATH.4.OA.B.4", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Factors & Multiples", gradeLevel: "4", name: "Prime and Composite", description: "Determine if a number is prime or composite", orderInStrand: 2, standardCode: "CCSS.MATH.4.OA.B.4", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Factors & Multiples", gradeLevel: "4", name: "Multiples", description: "Find multiples of numbers", orderInStrand: 3, standardCode: "CCSS.MATH.4.OA.B.4", difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "MATH", strand: "Factors & Multiples", gradeLevel: "4", name: "Number Patterns", description: "Generate and analyze patterns", orderInStrand: 4, standardCode: "CCSS.MATH.4.OA.C.5", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 4 - Geometry & Measurement
  { subject: "MATH", strand: "Geometry & Measurement", gradeLevel: "4", name: "Measure Angles", description: "Measure angles using a protractor", orderInStrand: 1, standardCode: "CCSS.MATH.4.MD.C.6", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Geometry & Measurement", gradeLevel: "4", name: "Classify Triangles", description: "Classify triangles by sides and angles", orderInStrand: 2, standardCode: "CCSS.MATH.4.G.A.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Geometry & Measurement", gradeLevel: "4", name: "Lines and Symmetry", description: "Identify lines of symmetry", orderInStrand: 3, standardCode: "CCSS.MATH.4.G.A.3", difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "MATH", strand: "Geometry & Measurement", gradeLevel: "4", name: "Convert Measurements", description: "Convert between measurement units", orderInStrand: 4, standardCode: "CCSS.MATH.4.MD.A.1", difficultyBand: "hard", estimatedLessons: 5 },
  
  // ============================================
  // GRADE 5 MATH SKILLS
  // ============================================
  
  // Grade 5 - Decimal Operations
  { subject: "MATH", strand: "Decimal Operations", gradeLevel: "5", name: "Read Write Decimals to Thousandths", description: "Read and write decimals to thousandths", orderInStrand: 1, standardCode: "CCSS.MATH.5.NBT.A.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Decimal Operations", gradeLevel: "5", name: "Compare Decimals to Thousandths", description: "Compare decimals to thousandths place", orderInStrand: 2, standardCode: "CCSS.MATH.5.NBT.A.3", difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "MATH", strand: "Decimal Operations", gradeLevel: "5", name: "Add Decimals", description: "Add decimals to hundredths", orderInStrand: 3, standardCode: "CCSS.MATH.5.NBT.B.7", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Decimal Operations", gradeLevel: "5", name: "Subtract Decimals", description: "Subtract decimals to hundredths", orderInStrand: 4, standardCode: "CCSS.MATH.5.NBT.B.7", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Decimal Operations", gradeLevel: "5", name: "Multiply Decimals", description: "Multiply decimals to hundredths", orderInStrand: 5, standardCode: "CCSS.MATH.5.NBT.B.7", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Decimal Operations", gradeLevel: "5", name: "Divide Decimals", description: "Divide decimals to hundredths", orderInStrand: 6, standardCode: "CCSS.MATH.5.NBT.B.7", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 5 - Fraction Operations
  { subject: "MATH", strand: "Fraction Operations", gradeLevel: "5", name: "Add Fractions Unlike Denominators", description: "Add fractions with unlike denominators", orderInStrand: 1, standardCode: "CCSS.MATH.5.NF.A.1", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fraction Operations", gradeLevel: "5", name: "Subtract Fractions Unlike Denominators", description: "Subtract fractions with unlike denominators", orderInStrand: 2, standardCode: "CCSS.MATH.5.NF.A.1", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fraction Operations", gradeLevel: "5", name: "Multiply Fractions", description: "Multiply fractions and mixed numbers", orderInStrand: 3, standardCode: "CCSS.MATH.5.NF.B.4", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fraction Operations", gradeLevel: "5", name: "Divide Fractions", description: "Divide unit fractions by whole numbers", orderInStrand: 4, standardCode: "CCSS.MATH.5.NF.B.7", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Fraction Operations", gradeLevel: "5", name: "Fraction Word Problems", description: "Solve real-world problems with fractions", orderInStrand: 5, standardCode: "CCSS.MATH.5.NF.B.6", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 5 - Volume & Coordinate Planes
  { subject: "MATH", strand: "Volume & Coordinate Planes", gradeLevel: "5", name: "Understand Volume", description: "Recognize volume as an attribute of solid figures", orderInStrand: 1, standardCode: "CCSS.MATH.5.MD.C.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Volume & Coordinate Planes", gradeLevel: "5", name: "Calculate Volume", description: "Calculate volume of rectangular prisms", orderInStrand: 2, standardCode: "CCSS.MATH.5.MD.C.5", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Volume & Coordinate Planes", gradeLevel: "5", name: "Coordinate Graphing", description: "Graph points on a coordinate plane", orderInStrand: 3, standardCode: "CCSS.MATH.5.G.A.1", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Volume & Coordinate Planes", gradeLevel: "5", name: "Analyze Coordinate Graphs", description: "Interpret coordinate graphs in context", orderInStrand: 4, standardCode: "CCSS.MATH.5.G.A.2", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 5 - Algebraic Thinking
  { subject: "MATH", strand: "Algebraic Thinking", gradeLevel: "5", name: "Write Expressions", description: "Write and interpret numerical expressions", orderInStrand: 1, standardCode: "CCSS.MATH.5.OA.A.1", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Algebraic Thinking", gradeLevel: "5", name: "Order of Operations", description: "Evaluate expressions using order of operations", orderInStrand: 2, standardCode: "CCSS.MATH.5.OA.A.1", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "MATH", strand: "Algebraic Thinking", gradeLevel: "5", name: "Analyze Patterns", description: "Analyze patterns and relationships", orderInStrand: 3, standardCode: "CCSS.MATH.5.OA.B.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "MATH", strand: "Algebraic Thinking", gradeLevel: "5", name: "Generate Number Patterns", description: "Generate two numerical patterns from given rules", orderInStrand: 4, standardCode: "CCSS.MATH.5.OA.B.3", difficultyBand: "hard", estimatedLessons: 4 },
];

// ============================================
// READING CURRICULUM - K-5 Progression
// ============================================

const readingStrands: StrandDef[] = [
  // Kindergarten
  { subject: "READING", grade: "K", name: "Print Concepts", description: "Understand basic features of print", orderInSubject: 1, estimatedWeeks: 8 },
  { subject: "READING", grade: "K", name: "Phonological Awareness", description: "Develop awareness of sounds in spoken words", orderInSubject: 2, estimatedWeeks: 12 },
  { subject: "READING", grade: "K", name: "Phonics & Word Recognition", description: "Learn letter-sound relationships", orderInSubject: 3, estimatedWeeks: 12 },
  { subject: "READING", grade: "K", name: "Fluency & Comprehension", description: "Read emergent texts with understanding", orderInSubject: 4, estimatedWeeks: 8 },
  
  // Grade 1
  { subject: "READING", grade: "1", name: "Phonics & Decoding", description: "Apply phonics skills to decode words", orderInSubject: 1, estimatedWeeks: 14 },
  { subject: "READING", grade: "1", name: "Fluency", description: "Read grade-level text with accuracy and expression", orderInSubject: 2, estimatedWeeks: 10 },
  { subject: "READING", grade: "1", name: "Vocabulary", description: "Determine word meanings using strategies", orderInSubject: 3, estimatedWeeks: 8 },
  { subject: "READING", grade: "1", name: "Comprehension", description: "Understand and respond to literature and informational text", orderInSubject: 4, estimatedWeeks: 8 },
  
  // Grade 2
  { subject: "READING", grade: "2", name: "Advanced Phonics", description: "Decode multisyllabic words", orderInSubject: 1, estimatedWeeks: 10 },
  { subject: "READING", grade: "2", name: "Fluency", description: "Read with sufficient accuracy and fluency", orderInSubject: 2, estimatedWeeks: 10 },
  { subject: "READING", grade: "2", name: "Vocabulary Development", description: "Use context and word parts to determine meanings", orderInSubject: 3, estimatedWeeks: 8 },
  { subject: "READING", grade: "2", name: "Comprehension Strategies", description: "Apply comprehension strategies to various text types", orderInSubject: 4, estimatedWeeks: 10 },
  
  // Grade 3
  { subject: "READING", grade: "3", name: "Word Analysis", description: "Use morphology to decode and understand words", orderInSubject: 1, estimatedWeeks: 8 },
  { subject: "READING", grade: "3", name: "Fluency", description: "Read grade-level text fluently with expression", orderInSubject: 2, estimatedWeeks: 10 },
  { subject: "READING", grade: "3", name: "Literary Analysis", description: "Analyze story elements and literary devices", orderInSubject: 3, estimatedWeeks: 10 },
  { subject: "READING", grade: "3", name: "Informational Text", description: "Read and comprehend informational texts", orderInSubject: 4, estimatedWeeks: 10 },
  
  // Grade 4
  { subject: "READING", grade: "4", name: "Advanced Vocabulary", description: "Use Greek and Latin roots to understand words", orderInSubject: 1, estimatedWeeks: 10 },
  { subject: "READING", grade: "4", name: "Literature Analysis", description: "Analyze theme, characters, and plot in depth", orderInSubject: 2, estimatedWeeks: 12 },
  { subject: "READING", grade: "4", name: "Informational Text Analysis", description: "Analyze structure and integration of information", orderInSubject: 3, estimatedWeeks: 10 },
  { subject: "READING", grade: "4", name: "Reading Across Genres", description: "Compare and contrast texts across genres", orderInSubject: 4, estimatedWeeks: 8 },
  
  // Grade 5
  { subject: "READING", grade: "5", name: "Word Study", description: "Analyze word relationships and nuances", orderInSubject: 1, estimatedWeeks: 8 },
  { subject: "READING", grade: "5", name: "Literary Analysis", description: "Analyze complex themes and narrator perspectives", orderInSubject: 2, estimatedWeeks: 12 },
  { subject: "READING", grade: "5", name: "Critical Reading", description: "Evaluate arguments and evidence in texts", orderInSubject: 3, estimatedWeeks: 10 },
  { subject: "READING", grade: "5", name: "Synthesis & Integration", description: "Integrate information from multiple sources", orderInSubject: 4, estimatedWeeks: 8 },
];

const readingSkills: SkillDef[] = [
  // ============================================
  // KINDERGARTEN READING SKILLS
  // ============================================
  
  // Kindergarten - Print Concepts
  { subject: "READING", strand: "Print Concepts", gradeLevel: "K", name: "Book Orientation", description: "Understand that books are read left to right, top to bottom", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.K.1.A", difficultyBand: "easy", estimatedLessons: 2 },
  { subject: "READING", strand: "Print Concepts", gradeLevel: "K", name: "Word Spacing", description: "Recognize that words are separated by spaces", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.K.1.C", difficultyBand: "easy", estimatedLessons: 2 },
  { subject: "READING", strand: "Print Concepts", gradeLevel: "K", name: "Uppercase and Lowercase", description: "Recognize uppercase and lowercase letters are different forms", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.K.1.D", difficultyBand: "easy", estimatedLessons: 3 },
  
  // Kindergarten - Phonological Awareness
  { subject: "READING", strand: "Phonological Awareness", gradeLevel: "K", name: "Rhyming Words", description: "Recognize and produce rhyming words", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.K.2.A", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "READING", strand: "Phonological Awareness", gradeLevel: "K", name: "Syllable Counting", description: "Count syllables in spoken words", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.K.2.B", difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "READING", strand: "Phonological Awareness", gradeLevel: "K", name: "Beginning Sounds", description: "Identify the beginning sound in words", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.K.2.D", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Phonological Awareness", gradeLevel: "K", name: "Ending Sounds", description: "Identify the ending sound in words", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RF.K.2.D", difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "READING", strand: "Phonological Awareness", gradeLevel: "K", name: "Middle Sounds", description: "Identify the middle vowel sound in CVC words", orderInStrand: 5, standardCode: "CCSS.ELA-LITERACY.RF.K.2.D", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Phonological Awareness", gradeLevel: "K", name: "Blend Sounds", description: "Blend individual sounds to form words", orderInStrand: 6, standardCode: "CCSS.ELA-LITERACY.RF.K.2.C", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Kindergarten - Phonics & Word Recognition
  { subject: "READING", strand: "Phonics & Word Recognition", gradeLevel: "K", name: "Letter Names", description: "Name all uppercase and lowercase letters", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.K.1.D", difficultyBand: "easy", estimatedLessons: 6 },
  { subject: "READING", strand: "Phonics & Word Recognition", gradeLevel: "K", name: "Consonant Sounds", description: "Produce sounds for each consonant", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.K.3.A", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Phonics & Word Recognition", gradeLevel: "K", name: "Short Vowel Sounds", description: "Produce sounds for each short vowel", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.K.3.A", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Phonics & Word Recognition", gradeLevel: "K", name: "CVC Words", description: "Read common CVC words (cat, dog, run)", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RF.K.3.B", difficultyBand: "medium", estimatedLessons: 6 },
  { subject: "READING", strand: "Phonics & Word Recognition", gradeLevel: "K", name: "Sight Words (Level 1)", description: "Read high-frequency words: the, a, to, I, is", orderInStrand: 5, standardCode: "CCSS.ELA-LITERACY.RF.K.3.C", difficultyBand: "easy", estimatedLessons: 4 },
  { subject: "READING", strand: "Phonics & Word Recognition", gradeLevel: "K", name: "Sight Words (Level 2)", description: "Read high-frequency words: he, she, we, my, you", orderInStrand: 6, standardCode: "CCSS.ELA-LITERACY.RF.K.3.C", difficultyBand: "medium", estimatedLessons: 4 },
  
  // Kindergarten - Fluency & Comprehension
  { subject: "READING", strand: "Fluency & Comprehension", gradeLevel: "K", name: "Read Emergent Texts", description: "Read simple emergent-reader texts with purpose", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.K.4", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Fluency & Comprehension", gradeLevel: "K", name: "Retell Stories", description: "Retell familiar stories with key details", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RL.K.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Fluency & Comprehension", gradeLevel: "K", name: "Story Characters", description: "Identify characters and settings in stories", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RL.K.3", difficultyBand: "easy", estimatedLessons: 3 },
  
  // ============================================
  // GRADE 1 READING SKILLS
  // ============================================
  
  // Grade 1 - Phonics & Decoding
  { subject: "READING", strand: "Phonics & Decoding", gradeLevel: "1", name: "Consonant Digraphs", description: "Read words with digraphs (sh, ch, th, wh)", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.1.3.A", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Phonics & Decoding", gradeLevel: "1", name: "Long Vowel Patterns", description: "Read words with long vowel patterns (CVCe, vowel teams)", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.1.3.C", difficultyBand: "medium", estimatedLessons: 6 },
  { subject: "READING", strand: "Phonics & Decoding", gradeLevel: "1", name: "Consonant Blends", description: "Read words with initial and final blends", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.1.3.A", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Phonics & Decoding", gradeLevel: "1", name: "Two-Syllable Words", description: "Decode two-syllable words", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RF.1.3.D", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Phonics & Decoding", gradeLevel: "1", name: "R-Controlled Vowels", description: "Read words with r-controlled vowels (ar, er, ir, or, ur)", orderInStrand: 5, standardCode: "CCSS.ELA-LITERACY.RF.1.3", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 1 - Fluency
  { subject: "READING", strand: "Fluency", gradeLevel: "1", name: "Read with Accuracy", description: "Read grade-level text with accuracy", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.1.4.A", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Fluency", gradeLevel: "1", name: "Read with Expression", description: "Read with appropriate expression and phrasing", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.1.4.B", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Fluency", gradeLevel: "1", name: "Self-Correction", description: "Use context to self-correct when reading", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.1.4.C", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 1 - Vocabulary
  { subject: "READING", strand: "Vocabulary", gradeLevel: "1", name: "Context Clues", description: "Use sentence-level context to understand word meanings", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.L.1.4.A", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Vocabulary", gradeLevel: "1", name: "Word Categories", description: "Sort words into categories (colors, animals, foods)", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.L.1.5.A", difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "READING", strand: "Vocabulary", gradeLevel: "1", name: "Root Words and Affixes", description: "Use common affixes to understand words", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.L.1.4.B", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 1 - Comprehension
  { subject: "READING", strand: "Comprehension", gradeLevel: "1", name: "Story Elements", description: "Describe characters, settings, and major events", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RL.1.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Comprehension", gradeLevel: "1", name: "Central Message", description: "Retell stories and identify the central message", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RL.1.2", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Comprehension", gradeLevel: "1", name: "Ask and Answer Questions", description: "Ask and answer questions about key details in text", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RL.1.1", difficultyBand: "medium", estimatedLessons: 4 },
  
  // ============================================
  // GRADE 2 READING SKILLS
  // ============================================
  
  // Grade 2 - Advanced Phonics
  { subject: "READING", strand: "Advanced Phonics", gradeLevel: "2", name: "Vowel Teams", description: "Read words with common vowel teams", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.2.3.B", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Advanced Phonics", gradeLevel: "2", name: "Silent Letters", description: "Decode words with silent letters (knee, write)", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.2.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Advanced Phonics", gradeLevel: "2", name: "Multisyllabic Words", description: "Decode regularly spelled multisyllabic words", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.2.3.C", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Advanced Phonics", gradeLevel: "2", name: "Prefixes and Suffixes", description: "Decode words with common prefixes and suffixes", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RF.2.3.D", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 2 - Fluency
  { subject: "READING", strand: "Fluency", gradeLevel: "2", name: "Oral Reading Fluency", description: "Read grade-level text orally with accuracy and fluency", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.2.4.A", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Fluency", gradeLevel: "2", name: "Reading Rate", description: "Read at an appropriate rate to support comprehension", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.2.4.B", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Fluency", gradeLevel: "2", name: "Prosody", description: "Read with appropriate prosody and expression", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.2.4.B", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 2 - Vocabulary Development
  { subject: "READING", strand: "Vocabulary Development", gradeLevel: "2", name: "Context Clues Advanced", description: "Use context to determine meaning of unknown words", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.L.2.4.A", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Vocabulary Development", gradeLevel: "2", name: "Compound Words", description: "Determine the meaning of compound words", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.L.2.4.D", difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "READING", strand: "Vocabulary Development", gradeLevel: "2", name: "Multiple Meaning Words", description: "Use context to distinguish multiple meanings", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.L.2.5.A", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 2 - Comprehension Strategies
  { subject: "READING", strand: "Comprehension Strategies", gradeLevel: "2", name: "Story Sequence", description: "Recount stories and determine their central message", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RL.2.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Comprehension Strategies", gradeLevel: "2", name: "Character Responses", description: "Describe how characters respond to events", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RL.2.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Comprehension Strategies", gradeLevel: "2", name: "Main Topic", description: "Identify the main topic of informational text", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RI.2.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Comprehension Strategies", gradeLevel: "2", name: "Compare Versions", description: "Compare two or more versions of the same story", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RL.2.9", difficultyBand: "hard", estimatedLessons: 4 },
  
  // ============================================
  // GRADE 3 READING SKILLS
  // ============================================
  
  // Grade 3 - Word Analysis
  { subject: "READING", strand: "Word Analysis", gradeLevel: "3", name: "Latin Prefixes", description: "Use common Latin prefixes (un-, re-, dis-) to decode words", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.3.3.A", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Word Analysis", gradeLevel: "3", name: "Latin Suffixes", description: "Use common Latin suffixes (-ful, -less, -ment) to decode words", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.3.3.A", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Word Analysis", gradeLevel: "3", name: "Grade-Level Words", description: "Decode grade-appropriate irregularly spelled words", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RF.3.3.D", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 3 - Fluency
  { subject: "READING", strand: "Fluency", gradeLevel: "3", name: "Fluent Reading", description: "Read grade-level prose and poetry with fluency", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RF.3.4.A", difficultyBand: "medium", estimatedLessons: 5 },
  { subject: "READING", strand: "Fluency", gradeLevel: "3", name: "Expression and Phrasing", description: "Read with appropriate phrasing and expression", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RF.3.4.B", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 3 - Literary Analysis
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "3", name: "Character Traits", description: "Describe characters and explain how their actions affect the plot", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RL.3.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "3", name: "Theme", description: "Recount stories and determine the theme", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RL.3.2", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "3", name: "Point of View", description: "Distinguish own point of view from narrator or characters", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RL.3.6", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "3", name: "Figurative Language", description: "Identify literal and nonliteral language in text", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RL.3.4", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 3 - Informational Text
  { subject: "READING", strand: "Informational Text", gradeLevel: "3", name: "Main Idea and Details", description: "Determine the main idea and key details", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RI.3.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Informational Text", gradeLevel: "3", name: "Text Structure", description: "Use text features to locate information", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RI.3.5", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Informational Text", gradeLevel: "3", name: "Cause and Effect", description: "Describe the relationship between events and ideas", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RI.3.3", difficultyBand: "hard", estimatedLessons: 4 },
  
  // ============================================
  // GRADE 4 READING SKILLS
  // ============================================
  
  // Grade 4 - Advanced Vocabulary
  { subject: "READING", strand: "Advanced Vocabulary", gradeLevel: "4", name: "Greek Roots", description: "Use Greek roots to determine word meanings", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.L.4.4.B", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Advanced Vocabulary", gradeLevel: "4", name: "Latin Roots", description: "Use Latin roots to determine word meanings", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.L.4.4.B", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Advanced Vocabulary", gradeLevel: "4", name: "Reference Materials", description: "Consult reference materials to find pronunciation and meaning", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.L.4.4.C", difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "READING", strand: "Advanced Vocabulary", gradeLevel: "4", name: "Figurative Language Advanced", description: "Explain the meaning of similes and metaphors", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.L.4.5.A", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 4 - Literature Analysis
  { subject: "READING", strand: "Literature Analysis", gradeLevel: "4", name: "Theme Development", description: "Determine theme from details and summarize text", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RL.4.2", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Literature Analysis", gradeLevel: "4", name: "Character and Setting", description: "Describe in depth a character, setting, or event", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RL.4.3", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Literature Analysis", gradeLevel: "4", name: "First vs Third Person", description: "Compare first and third person narratives", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RL.4.6", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Literature Analysis", gradeLevel: "4", name: "Poetry and Prose", description: "Explain structural differences between poems and prose", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RL.4.5", difficultyBand: "medium", estimatedLessons: 4 },
  
  // Grade 4 - Informational Text Analysis
  { subject: "READING", strand: "Informational Text Analysis", gradeLevel: "4", name: "Main Idea Summary", description: "Determine the main idea and summarize the text", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RI.4.2", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Informational Text Analysis", gradeLevel: "4", name: "Text Structure Advanced", description: "Describe the overall structure of a text", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RI.4.5", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Informational Text Analysis", gradeLevel: "4", name: "Integrate Information", description: "Integrate information from two texts on the same topic", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RI.4.9", difficultyBand: "hard", estimatedLessons: 5 },
  
  // Grade 4 - Reading Across Genres
  { subject: "READING", strand: "Reading Across Genres", gradeLevel: "4", name: "Compare Themes", description: "Compare and contrast similar themes across genres", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RL.4.9", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Reading Across Genres", gradeLevel: "4", name: "Myths and Legends", description: "Compare and contrast myths and traditional stories", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RL.4.9", difficultyBand: "medium", estimatedLessons: 4 },
  
  // ============================================
  // GRADE 5 READING SKILLS
  // ============================================
  
  // Grade 5 - Word Study
  { subject: "READING", strand: "Word Study", gradeLevel: "5", name: "Word Relationships", description: "Use relationships between words to understand nuances", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.L.5.5.B", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Word Study", gradeLevel: "5", name: "Connotation and Denotation", description: "Distinguish between connotation and denotation", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.L.5.5.C", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Word Study", gradeLevel: "5", name: "Advanced Greek Roots", description: "Use Greek and Latin affixes and roots", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.L.5.4.B", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 5 - Literary Analysis
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "5", name: "Complex Themes", description: "Determine themes and how characters respond to challenges", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RL.5.2", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "5", name: "Narrator Perspective", description: "Describe how a narrator's point of view influences events", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RL.5.6", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "5", name: "Literary Elements", description: "Explain how chapters and stanzas fit together", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RL.5.5", difficultyBand: "medium", estimatedLessons: 4 },
  { subject: "READING", strand: "Literary Analysis", gradeLevel: "5", name: "Compare Text Treatments", description: "Compare approaches to similar themes in different texts", orderInStrand: 4, standardCode: "CCSS.ELA-LITERACY.RL.5.9", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 5 - Critical Reading
  { subject: "READING", strand: "Critical Reading", gradeLevel: "5", name: "Author Purpose", description: "Analyze how an author uses reasons and evidence", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RI.5.8", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Critical Reading", gradeLevel: "5", name: "Evaluate Arguments", description: "Identify and evaluate the author's argument", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RI.5.8", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Critical Reading", gradeLevel: "5", name: "Compare Accounts", description: "Analyze multiple accounts of the same event", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RI.5.6", difficultyBand: "hard", estimatedLessons: 4 },
  
  // Grade 5 - Synthesis & Integration
  { subject: "READING", strand: "Synthesis & Integration", gradeLevel: "5", name: "Multiple Sources", description: "Integrate information from multiple sources", orderInStrand: 1, standardCode: "CCSS.ELA-LITERACY.RI.5.7", difficultyBand: "hard", estimatedLessons: 5 },
  { subject: "READING", strand: "Synthesis & Integration", gradeLevel: "5", name: "Draw on Evidence", description: "Draw on information from multiple texts", orderInStrand: 2, standardCode: "CCSS.ELA-LITERACY.RI.5.9", difficultyBand: "hard", estimatedLessons: 4 },
  { subject: "READING", strand: "Synthesis & Integration", gradeLevel: "5", name: "Reading Independence", description: "Read and comprehend grade-level text independently", orderInStrand: 3, standardCode: "CCSS.ELA-LITERACY.RI.5.10", difficultyBand: "medium", estimatedLessons: 5 },
];

// ============================================
// CHARACTER CURRICULUM - K-5 Progression
// ============================================

const characterStrands: StrandDef[] = [
  // Kindergarten
  { subject: "CHARACTER", grade: "K", name: "Kindness & Love", description: "Show love and kindness to others", orderInSubject: 1, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "K", name: "Obedience & Respect", description: "Follow instructions and respect authority", orderInSubject: 2, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "K", name: "Self-Control", description: "Learn to manage emotions and impulses", orderInSubject: 3, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "K", name: "Thankfulness", description: "Develop a grateful heart", orderInSubject: 4, estimatedWeeks: 9 },
  
  // Grade 1
  { subject: "CHARACTER", grade: "1", name: "Honesty & Truth", description: "Tell the truth and be trustworthy", orderInSubject: 1, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "1", name: "Patience & Perseverance", description: "Wait patiently and keep trying", orderInSubject: 2, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "1", name: "Generosity", description: "Share with others joyfully", orderInSubject: 3, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "1", name: "Courage", description: "Stand up for what is right", orderInSubject: 4, estimatedWeeks: 9 },
  
  // Grade 2
  { subject: "CHARACTER", grade: "2", name: "Responsibility", description: "Take ownership of actions and duties", orderInSubject: 1, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "2", name: "Forgiveness", description: "Forgive others as God forgives us", orderInSubject: 2, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "2", name: "Humility", description: "Think of others before yourself", orderInSubject: 3, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "2", name: "Diligence", description: "Work hard and do your best", orderInSubject: 4, estimatedWeeks: 9 },
  
  // Grade 3
  { subject: "CHARACTER", grade: "3", name: "Integrity", description: "Do what is right even when no one is watching", orderInSubject: 1, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "3", name: "Compassion", description: "Show care and concern for others' needs", orderInSubject: 2, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "3", name: "Contentment", description: "Be satisfied with what you have", orderInSubject: 3, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "3", name: "Faithfulness", description: "Be reliable and keep your promises", orderInSubject: 4, estimatedWeeks: 9 },
  
  // Grade 4
  { subject: "CHARACTER", grade: "4", name: "Justice & Fairness", description: "Treat others fairly and stand for justice", orderInSubject: 1, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "4", name: "Wisdom", description: "Make wise choices based on God's truth", orderInSubject: 2, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "4", name: "Gentleness", description: "Respond with gentleness, not harshness", orderInSubject: 3, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "4", name: "Service", description: "Serve others with a joyful heart", orderInSubject: 4, estimatedWeeks: 9 },
  
  // Grade 5
  { subject: "CHARACTER", grade: "5", name: "Leadership", description: "Lead by example and encourage others", orderInSubject: 1, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "5", name: "Discernment", description: "Recognize truth from falsehood", orderInSubject: 2, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "5", name: "Stewardship", description: "Care for God's creation and resources", orderInSubject: 3, estimatedWeeks: 9 },
  { subject: "CHARACTER", grade: "5", name: "Evangelism", description: "Share God's love with others", orderInSubject: 4, estimatedWeeks: 9 },
];

const characterSkills: SkillDef[] = [
  // Kindergarten - Kindness & Love
  { subject: "CHARACTER", strand: "Kindness & Love", gradeLevel: "K", name: "Sharing with Others", description: "Learn to share toys and materials with friends", orderInStrand: 1, difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "CHARACTER", strand: "Kindness & Love", gradeLevel: "K", name: "Kind Words", description: "Use kind words when speaking to others", orderInStrand: 2, difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "CHARACTER", strand: "Kindness & Love", gradeLevel: "K", name: "Helping Others", description: "Look for ways to help family and friends", orderInStrand: 3, difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "CHARACTER", strand: "Kindness & Love", gradeLevel: "K", name: "Including Others", description: "Include others in play and activities", orderInStrand: 4, difficultyBand: "medium", estimatedLessons: 3 },
  
  // Grade 1 - Honesty & Truth
  { subject: "CHARACTER", strand: "Honesty & Truth", gradeLevel: "1", name: "Telling the Truth", description: "Always tell the truth, even when it's hard", orderInStrand: 1, difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "CHARACTER", strand: "Honesty & Truth", gradeLevel: "1", name: "Admitting Mistakes", description: "Admit when you make a mistake", orderInStrand: 2, difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "CHARACTER", strand: "Honesty & Truth", gradeLevel: "1", name: "Keeping Promises", description: "Keep the promises you make", orderInStrand: 3, difficultyBand: "medium", estimatedLessons: 3 },
  
  // Grade 2 - Responsibility
  { subject: "CHARACTER", strand: "Responsibility", gradeLevel: "2", name: "Taking Care of Belongings", description: "Take care of your things and put them away", orderInStrand: 1, difficultyBand: "easy", estimatedLessons: 3 },
  { subject: "CHARACTER", strand: "Responsibility", gradeLevel: "2", name: "Completing Tasks", description: "Finish what you start without being reminded", orderInStrand: 2, difficultyBand: "medium", estimatedLessons: 3 },
  { subject: "CHARACTER", strand: "Responsibility", gradeLevel: "2", name: "Accepting Consequences", description: "Accept the results of your choices", orderInStrand: 3, difficultyBand: "hard", estimatedLessons: 3 },
];

// ============================================
// YEAR-END GOALS
// ============================================

const yearEndGoalDefs: GoalDef[] = [
  // Math K
  { subject: "MATH", grade: "K", title: "Count to 100 fluently", description: "Count forward from any number within 100, count objects to 20", standardCode: "CCSS.MATH.K.CC", orderInSubject: 1 },
  { subject: "MATH", grade: "K", title: "Add and subtract within 10", description: "Fluently add and subtract within 10 using objects, drawings, and mental math", standardCode: "CCSS.MATH.K.OA", orderInSubject: 2 },
  
  // Math 1
  { subject: "MATH", grade: "1", title: "Add and subtract within 20 fluently", description: "Fluently add and subtract within 20 using mental strategies", standardCode: "CCSS.MATH.1.OA.C.6", orderInSubject: 1 },
  { subject: "MATH", grade: "1", title: "Understand place value", description: "Understand that two-digit numbers represent tens and ones", standardCode: "CCSS.MATH.1.NBT", orderInSubject: 2 },
  
  // Math 2
  { subject: "MATH", grade: "2", title: "Add and subtract within 100 fluently", description: "Fluently add and subtract within 100 using strategies based on place value", standardCode: "CCSS.MATH.2.NBT.B.5", orderInSubject: 1 },
  { subject: "MATH", grade: "2", title: "Understand foundations of multiplication", description: "Work with equal groups and arrays as foundation for multiplication", standardCode: "CCSS.MATH.2.OA.C", orderInSubject: 2 },
  
  // Math 3
  { subject: "MATH", grade: "3", title: "Master multiplication and division facts", description: "Know all multiplication facts within 100 and related division facts", standardCode: "CCSS.MATH.3.OA.C.7", orderInSubject: 1 },
  { subject: "MATH", grade: "3", title: "Understand fractions as numbers", description: "Understand fractions as numbers on the number line and compare fractions", standardCode: "CCSS.MATH.3.NF", orderInSubject: 2 },
  
  // Reading K
  { subject: "READING", grade: "K", title: "Know all letter sounds", description: "Produce the primary sound for each letter and read common CVC words", standardCode: "CCSS.ELA-LITERACY.RF.K.3", orderInSubject: 1 },
  { subject: "READING", grade: "K", title: "Read emergent reader texts", description: "Read emergent reader texts with purpose and understanding", standardCode: "CCSS.ELA-LITERACY.RF.K.4", orderInSubject: 2 },
  
  // Reading 1
  { subject: "READING", grade: "1", title: "Decode words with common patterns", description: "Decode words with common vowel patterns and digraphs", standardCode: "CCSS.ELA-LITERACY.RF.1.3", orderInSubject: 1 },
  { subject: "READING", grade: "1", title: "Read grade-level text fluently", description: "Read grade-level text with sufficient accuracy and fluency", standardCode: "CCSS.ELA-LITERACY.RF.1.4", orderInSubject: 2 },
  
  // Character K
  { subject: "CHARACTER", grade: "K", title: "Show kindness and self-control", description: "Demonstrate kindness to others and basic self-control of emotions", orderInSubject: 1 },
  
  // Character 1
  { subject: "CHARACTER", grade: "1", title: "Practice honesty and patience", description: "Tell the truth consistently and wait patiently in various situations", orderInSubject: 1 },
];

export async function seedCurriculumProgressions() {
  console.log("Checking if curriculum needs to be seeded...");
  
  // Check if already seeded
  const existingStrands = await db.select().from(curriculumStrands).limit(1);
  if (existingStrands.length > 0) {
    console.log("Curriculum already seeded. Skipping.");
    return;
  }
  
  console.log("Seeding curriculum progressions...");
  
  // Seed strands
  const allStrands = [...mathStrands, ...readingStrands, ...characterStrands];
  const insertedStrands: Record<string, string> = {}; // key: "SUBJECT-grade-name" -> id
  
  for (const strand of allStrands) {
    const [inserted] = await db.insert(curriculumStrands).values({
      subject: strand.subject,
      grade: strand.grade,
      name: strand.name,
      description: strand.description,
      orderInSubject: strand.orderInSubject,
      estimatedWeeks: strand.estimatedWeeks,
    }).returning();
    
    insertedStrands[`${strand.subject}-${strand.grade}-${strand.name}`] = inserted.id;
  }
  console.log(`Inserted ${Object.keys(insertedStrands).length} curriculum strands`);
  
  // Seed skills with strand references
  const allSkills = [...mathSkills, ...readingSkills, ...characterSkills];
  const insertedSkills: Record<string, string> = {}; // key: "SUBJECT-grade-name" -> id
  
  for (const skill of allSkills) {
    const strandKey = `${skill.subject}-${skill.gradeLevel}-${skill.strand}`;
    const strandId = insertedStrands[strandKey];
    
    const [inserted] = await db.insert(skills).values({
      subject: skill.subject,
      strand: skill.strand,
      gradeLevel: skill.gradeLevel,
      name: skill.name,
      description: skill.description,
      orderInStrand: skill.orderInStrand,
      standardCode: skill.standardCode,
      difficultyBand: skill.difficultyBand,
      estimatedLessons: skill.estimatedLessons,
      strandId: strandId,
    }).returning();
    
    insertedSkills[`${skill.subject}-${skill.gradeLevel}-${skill.name}`] = inserted.id;
  }
  console.log(`Inserted ${Object.keys(insertedSkills).length} skills`);
  
  // Create skill edges (prerequisites)
  const skillEdgeDefs: { prereq: string; dependent: string }[] = [
    // ============================================
    // MATH K PROGRESSIONS
    // ============================================
    { prereq: "MATH-K-Count to 10", dependent: "MATH-K-Count to 20" },
    { prereq: "MATH-K-Count to 20", dependent: "MATH-K-Count to 50" },
    { prereq: "MATH-K-Count to 50", dependent: "MATH-K-Count to 100" },
    { prereq: "MATH-K-Count to 10", dependent: "MATH-K-Count Objects to 10" },
    { prereq: "MATH-K-Count Objects to 10", dependent: "MATH-K-Count Objects to 20" },
    { prereq: "MATH-K-Count to 10", dependent: "MATH-K-Write Numbers 0-10" },
    { prereq: "MATH-K-Write Numbers 0-10", dependent: "MATH-K-Write Numbers 11-20" },
    { prereq: "MATH-K-Count Objects to 10", dependent: "MATH-K-Addition within 5" },
    { prereq: "MATH-K-Addition within 5", dependent: "MATH-K-Subtraction within 5" },
    { prereq: "MATH-K-Addition within 5", dependent: "MATH-K-Addition within 10" },
    { prereq: "MATH-K-Subtraction within 5", dependent: "MATH-K-Subtraction within 10" },
    { prereq: "MATH-K-Addition within 10", dependent: "MATH-K-Ways to Make 10" },
    { prereq: "MATH-K-Count Objects to 10", dependent: "MATH-K-Compare Numbers to 10" },
    { prereq: "MATH-K-Compare Numbers to 10", dependent: "MATH-K-More and Less" },
    { prereq: "MATH-K-More and Less", dependent: "MATH-K-One More One Less" },
    
    // ============================================
    // MATH K → 1 PROGRESSIONS
    // ============================================
    { prereq: "MATH-K-Addition within 10", dependent: "MATH-1-Addition within 10 Fluency" },
    { prereq: "MATH-K-Subtraction within 10", dependent: "MATH-1-Subtraction within 10 Fluency" },
    { prereq: "MATH-1-Addition within 10 Fluency", dependent: "MATH-1-Addition within 20" },
    { prereq: "MATH-1-Subtraction within 10 Fluency", dependent: "MATH-1-Subtraction within 20" },
    { prereq: "MATH-1-Addition within 20", dependent: "MATH-1-Missing Addend Problems" },
    { prereq: "MATH-1-Missing Addend Problems", dependent: "MATH-1-Word Problems within 20" },
    { prereq: "MATH-K-Count to 100", dependent: "MATH-1-Count to 120" },
    { prereq: "MATH-1-Count to 120", dependent: "MATH-1-Tens and Ones" },
    { prereq: "MATH-1-Tens and Ones", dependent: "MATH-1-Compare Two-Digit Numbers" },
    { prereq: "MATH-1-Tens and Ones", dependent: "MATH-1-Add Tens" },
    
    // ============================================
    // MATH 1 → 2 PROGRESSIONS
    // ============================================
    { prereq: "MATH-1-Addition within 20", dependent: "MATH-2-Add Two-Digit Numbers" },
    { prereq: "MATH-1-Subtraction within 20", dependent: "MATH-2-Subtract Two-Digit Numbers" },
    { prereq: "MATH-2-Add Two-Digit Numbers", dependent: "MATH-2-Fluency within 100" },
    { prereq: "MATH-2-Subtract Two-Digit Numbers", dependent: "MATH-2-Fluency within 100" },
    { prereq: "MATH-2-Fluency within 100", dependent: "MATH-2-Word Problems Two-Step" },
    { prereq: "MATH-1-Tens and Ones", dependent: "MATH-2-Hundreds Tens Ones" },
    { prereq: "MATH-2-Hundreds Tens Ones", dependent: "MATH-2-Count to 1000" },
    { prereq: "MATH-2-Count to 1000", dependent: "MATH-2-Read Write Numbers to 1000" },
    { prereq: "MATH-2-Read Write Numbers to 1000", dependent: "MATH-2-Compare Three-Digit Numbers" },
    { prereq: "MATH-2-Add Two-Digit Numbers", dependent: "MATH-2-Equal Groups" },
    { prereq: "MATH-2-Equal Groups", dependent: "MATH-2-Arrays" },
    { prereq: "MATH-2-Arrays", dependent: "MATH-2-Repeated Addition" },
    
    // ============================================
    // MATH 2 → 3 PROGRESSIONS
    // ============================================
    { prereq: "MATH-2-Repeated Addition", dependent: "MATH-3-Multiplication Concept" },
    { prereq: "MATH-3-Multiplication Concept", dependent: "MATH-3-Multiply by 2, 5, 10" },
    { prereq: "MATH-3-Multiply by 2, 5, 10", dependent: "MATH-3-Multiply by 3, 4, 6" },
    { prereq: "MATH-3-Multiply by 3, 4, 6", dependent: "MATH-3-Multiply by 7, 8, 9" },
    { prereq: "MATH-3-Multiply by 2, 5, 10", dependent: "MATH-3-Division Concept" },
    { prereq: "MATH-3-Division Concept", dependent: "MATH-3-Division Facts within 100" },
    { prereq: "MATH-3-Division Facts within 100", dependent: "MATH-3-Word Problems Multiply Divide" },
    { prereq: "MATH-2-Fluency within 100", dependent: "MATH-3-Add within 1000" },
    { prereq: "MATH-2-Fluency within 100", dependent: "MATH-3-Subtract within 1000" },
    { prereq: "MATH-3-Multiply by 2, 5, 10", dependent: "MATH-3-Multiply by Multiples of 10" },
    { prereq: "MATH-1-Partition Shapes", dependent: "MATH-3-Understand Fractions" },
    { prereq: "MATH-3-Understand Fractions", dependent: "MATH-3-Fractions on Number Line" },
    { prereq: "MATH-3-Fractions on Number Line", dependent: "MATH-3-Equivalent Fractions" },
    { prereq: "MATH-3-Equivalent Fractions", dependent: "MATH-3-Compare Fractions" },
    { prereq: "MATH-3-Multiplication Concept", dependent: "MATH-3-Understand Area" },
    { prereq: "MATH-3-Understand Area", dependent: "MATH-3-Area of Rectangles" },
    { prereq: "MATH-3-Area of Rectangles", dependent: "MATH-3-Understand Perimeter" },
    { prereq: "MATH-3-Understand Perimeter", dependent: "MATH-3-Area and Perimeter Problems" },
    
    // ============================================
    // MATH 3 → 4 PROGRESSIONS
    // ============================================
    { prereq: "MATH-3-Multiply by 7, 8, 9", dependent: "MATH-4-Multiply by One-Digit" },
    { prereq: "MATH-4-Multiply by One-Digit", dependent: "MATH-4-Multiply Two-Digit by Two-Digit" },
    { prereq: "MATH-3-Division Facts within 100", dependent: "MATH-4-Divide by One-Digit" },
    { prereq: "MATH-4-Divide by One-Digit", dependent: "MATH-4-Division with Remainders" },
    { prereq: "MATH-3-Equivalent Fractions", dependent: "MATH-4-Equivalent Fractions Advanced" },
    { prereq: "MATH-4-Equivalent Fractions Advanced", dependent: "MATH-4-Compare Fractions" },
    { prereq: "MATH-4-Compare Fractions", dependent: "MATH-4-Add Fractions Same Denominator" },
    { prereq: "MATH-4-Add Fractions Same Denominator", dependent: "MATH-4-Subtract Fractions Same Denominator" },
    { prereq: "MATH-4-Add Fractions Same Denominator", dependent: "MATH-4-Multiply Fraction by Whole Number" },
    { prereq: "MATH-4-Compare Fractions", dependent: "MATH-4-Understand Decimals" },
    { prereq: "MATH-4-Understand Decimals", dependent: "MATH-4-Compare Decimals" },
    { prereq: "MATH-3-Multiply by 7, 8, 9", dependent: "MATH-4-Find Factor Pairs" },
    { prereq: "MATH-4-Find Factor Pairs", dependent: "MATH-4-Prime and Composite" },
    { prereq: "MATH-4-Find Factor Pairs", dependent: "MATH-4-Multiples" },
    { prereq: "MATH-4-Multiples", dependent: "MATH-4-Number Patterns" },
    
    // ============================================
    // MATH 4 → 5 PROGRESSIONS
    // ============================================
    { prereq: "MATH-4-Compare Decimals", dependent: "MATH-5-Read Write Decimals to Thousandths" },
    { prereq: "MATH-5-Read Write Decimals to Thousandths", dependent: "MATH-5-Compare Decimals to Thousandths" },
    { prereq: "MATH-5-Compare Decimals to Thousandths", dependent: "MATH-5-Add Decimals" },
    { prereq: "MATH-5-Add Decimals", dependent: "MATH-5-Subtract Decimals" },
    { prereq: "MATH-5-Subtract Decimals", dependent: "MATH-5-Multiply Decimals" },
    { prereq: "MATH-5-Multiply Decimals", dependent: "MATH-5-Divide Decimals" },
    { prereq: "MATH-4-Add Fractions Same Denominator", dependent: "MATH-5-Add Fractions Unlike Denominators" },
    { prereq: "MATH-4-Subtract Fractions Same Denominator", dependent: "MATH-5-Subtract Fractions Unlike Denominators" },
    { prereq: "MATH-5-Add Fractions Unlike Denominators", dependent: "MATH-5-Multiply Fractions" },
    { prereq: "MATH-5-Multiply Fractions", dependent: "MATH-5-Divide Fractions" },
    { prereq: "MATH-5-Divide Fractions", dependent: "MATH-5-Fraction Word Problems" },
    { prereq: "MATH-3-Area of Rectangles", dependent: "MATH-5-Understand Volume" },
    { prereq: "MATH-5-Understand Volume", dependent: "MATH-5-Calculate Volume" },
    { prereq: "MATH-4-Number Patterns", dependent: "MATH-5-Coordinate Graphing" },
    { prereq: "MATH-5-Coordinate Graphing", dependent: "MATH-5-Analyze Coordinate Graphs" },
    { prereq: "MATH-4-Number Patterns", dependent: "MATH-5-Write Expressions" },
    { prereq: "MATH-5-Write Expressions", dependent: "MATH-5-Order of Operations" },
    { prereq: "MATH-5-Order of Operations", dependent: "MATH-5-Analyze Patterns" },
    { prereq: "MATH-5-Analyze Patterns", dependent: "MATH-5-Generate Number Patterns" },
    
    // ============================================
    // READING K PROGRESSIONS
    // ============================================
    { prereq: "READING-K-Book Orientation", dependent: "READING-K-Word Spacing" },
    { prereq: "READING-K-Word Spacing", dependent: "READING-K-Uppercase and Lowercase" },
    { prereq: "READING-K-Rhyming Words", dependent: "READING-K-Syllable Counting" },
    { prereq: "READING-K-Syllable Counting", dependent: "READING-K-Beginning Sounds" },
    { prereq: "READING-K-Beginning Sounds", dependent: "READING-K-Ending Sounds" },
    { prereq: "READING-K-Ending Sounds", dependent: "READING-K-Middle Sounds" },
    { prereq: "READING-K-Middle Sounds", dependent: "READING-K-Blend Sounds" },
    { prereq: "READING-K-Letter Names", dependent: "READING-K-Consonant Sounds" },
    { prereq: "READING-K-Consonant Sounds", dependent: "READING-K-Short Vowel Sounds" },
    { prereq: "READING-K-Short Vowel Sounds", dependent: "READING-K-CVC Words" },
    { prereq: "READING-K-CVC Words", dependent: "READING-K-Sight Words (Level 1)" },
    { prereq: "READING-K-Sight Words (Level 1)", dependent: "READING-K-Sight Words (Level 2)" },
    { prereq: "READING-K-Sight Words (Level 2)", dependent: "READING-K-Read Emergent Texts" },
    { prereq: "READING-K-Read Emergent Texts", dependent: "READING-K-Retell Stories" },
    { prereq: "READING-K-Retell Stories", dependent: "READING-K-Story Characters" },
    
    // ============================================
    // READING K → 1 PROGRESSIONS
    // ============================================
    { prereq: "READING-K-CVC Words", dependent: "READING-1-Consonant Digraphs" },
    { prereq: "READING-1-Consonant Digraphs", dependent: "READING-1-Long Vowel Patterns" },
    { prereq: "READING-1-Consonant Digraphs", dependent: "READING-1-Consonant Blends" },
    { prereq: "READING-1-Long Vowel Patterns", dependent: "READING-1-Two-Syllable Words" },
    { prereq: "READING-1-Consonant Blends", dependent: "READING-1-R-Controlled Vowels" },
    { prereq: "READING-K-Read Emergent Texts", dependent: "READING-1-Read with Accuracy" },
    { prereq: "READING-1-Read with Accuracy", dependent: "READING-1-Read with Expression" },
    { prereq: "READING-1-Read with Expression", dependent: "READING-1-Self-Correction" },
    { prereq: "READING-K-Retell Stories", dependent: "READING-1-Story Elements" },
    { prereq: "READING-1-Story Elements", dependent: "READING-1-Central Message" },
    { prereq: "READING-1-Central Message", dependent: "READING-1-Ask and Answer Questions" },
    { prereq: "READING-K-CVC Words", dependent: "READING-1-Context Clues" },
    { prereq: "READING-1-Context Clues", dependent: "READING-1-Word Categories" },
    { prereq: "READING-1-Word Categories", dependent: "READING-1-Root Words and Affixes" },
    
    // ============================================
    // READING 1 → 2 PROGRESSIONS
    // ============================================
    { prereq: "READING-1-Long Vowel Patterns", dependent: "READING-2-Vowel Teams" },
    { prereq: "READING-2-Vowel Teams", dependent: "READING-2-Silent Letters" },
    { prereq: "READING-1-Two-Syllable Words", dependent: "READING-2-Multisyllabic Words" },
    { prereq: "READING-1-Root Words and Affixes", dependent: "READING-2-Prefixes and Suffixes" },
    { prereq: "READING-1-Read with Expression", dependent: "READING-2-Oral Reading Fluency" },
    { prereq: "READING-2-Oral Reading Fluency", dependent: "READING-2-Reading Rate" },
    { prereq: "READING-2-Reading Rate", dependent: "READING-2-Prosody" },
    { prereq: "READING-1-Context Clues", dependent: "READING-2-Context Clues Advanced" },
    { prereq: "READING-2-Context Clues Advanced", dependent: "READING-2-Compound Words" },
    { prereq: "READING-2-Compound Words", dependent: "READING-2-Multiple Meaning Words" },
    { prereq: "READING-1-Central Message", dependent: "READING-2-Story Sequence" },
    { prereq: "READING-2-Story Sequence", dependent: "READING-2-Character Responses" },
    { prereq: "READING-2-Character Responses", dependent: "READING-2-Main Topic" },
    { prereq: "READING-2-Main Topic", dependent: "READING-2-Compare Versions" },
    
    // ============================================
    // READING 2 → 3 PROGRESSIONS
    // ============================================
    { prereq: "READING-2-Prefixes and Suffixes", dependent: "READING-3-Latin Prefixes" },
    { prereq: "READING-3-Latin Prefixes", dependent: "READING-3-Latin Suffixes" },
    { prereq: "READING-2-Multisyllabic Words", dependent: "READING-3-Grade-Level Words" },
    { prereq: "READING-2-Prosody", dependent: "READING-3-Fluent Reading" },
    { prereq: "READING-3-Fluent Reading", dependent: "READING-3-Expression and Phrasing" },
    { prereq: "READING-2-Character Responses", dependent: "READING-3-Character Traits" },
    { prereq: "READING-3-Character Traits", dependent: "READING-3-Theme" },
    { prereq: "READING-3-Theme", dependent: "READING-3-Point of View" },
    { prereq: "READING-3-Point of View", dependent: "READING-3-Figurative Language" },
    { prereq: "READING-2-Main Topic", dependent: "READING-3-Main Idea and Details" },
    { prereq: "READING-3-Main Idea and Details", dependent: "READING-3-Text Structure" },
    { prereq: "READING-3-Text Structure", dependent: "READING-3-Cause and Effect" },
    
    // ============================================
    // READING 3 → 4 PROGRESSIONS
    // ============================================
    { prereq: "READING-3-Latin Prefixes", dependent: "READING-4-Greek Roots" },
    { prereq: "READING-3-Latin Suffixes", dependent: "READING-4-Latin Roots" },
    { prereq: "READING-4-Latin Roots", dependent: "READING-4-Reference Materials" },
    { prereq: "READING-3-Figurative Language", dependent: "READING-4-Figurative Language Advanced" },
    { prereq: "READING-3-Theme", dependent: "READING-4-Theme Development" },
    { prereq: "READING-4-Theme Development", dependent: "READING-4-Character and Setting" },
    { prereq: "READING-3-Point of View", dependent: "READING-4-First vs Third Person" },
    { prereq: "READING-4-First vs Third Person", dependent: "READING-4-Poetry and Prose" },
    { prereq: "READING-3-Main Idea and Details", dependent: "READING-4-Main Idea Summary" },
    { prereq: "READING-3-Text Structure", dependent: "READING-4-Text Structure Advanced" },
    { prereq: "READING-4-Text Structure Advanced", dependent: "READING-4-Integrate Information" },
    { prereq: "READING-3-Cause and Effect", dependent: "READING-4-Compare Themes" },
    { prereq: "READING-4-Compare Themes", dependent: "READING-4-Myths and Legends" },
    
    // ============================================
    // READING 4 → 5 PROGRESSIONS
    // ============================================
    { prereq: "READING-4-Figurative Language Advanced", dependent: "READING-5-Word Relationships" },
    { prereq: "READING-5-Word Relationships", dependent: "READING-5-Connotation and Denotation" },
    { prereq: "READING-4-Latin Roots", dependent: "READING-5-Advanced Greek Roots" },
    { prereq: "READING-4-Theme Development", dependent: "READING-5-Complex Themes" },
    { prereq: "READING-5-Complex Themes", dependent: "READING-5-Narrator Perspective" },
    { prereq: "READING-4-Poetry and Prose", dependent: "READING-5-Literary Elements" },
    { prereq: "READING-5-Literary Elements", dependent: "READING-5-Compare Text Treatments" },
    { prereq: "READING-4-Integrate Information", dependent: "READING-5-Author Purpose" },
    { prereq: "READING-5-Author Purpose", dependent: "READING-5-Evaluate Arguments" },
    { prereq: "READING-5-Evaluate Arguments", dependent: "READING-5-Compare Accounts" },
    { prereq: "READING-4-Compare Themes", dependent: "READING-5-Multiple Sources" },
    { prereq: "READING-5-Multiple Sources", dependent: "READING-5-Draw on Evidence" },
    { prereq: "READING-5-Draw on Evidence", dependent: "READING-5-Reading Independence" },
    
    // Character progressions
    { prereq: "CHARACTER-K-Sharing with Others", dependent: "CHARACTER-K-Kind Words" },
    { prereq: "CHARACTER-K-Kind Words", dependent: "CHARACTER-K-Helping Others" },
    { prereq: "CHARACTER-K-Helping Others", dependent: "CHARACTER-K-Including Others" },
    { prereq: "CHARACTER-1-Telling the Truth", dependent: "CHARACTER-1-Admitting Mistakes" },
    { prereq: "CHARACTER-1-Admitting Mistakes", dependent: "CHARACTER-1-Keeping Promises" },
  ];
  
  let edgeCount = 0;
  for (const edge of skillEdgeDefs) {
    const prereqId = insertedSkills[edge.prereq];
    const dependentId = insertedSkills[edge.dependent];
    
    if (prereqId && dependentId) {
      await db.insert(skillEdges).values({
        prerequisiteSkillId: prereqId,
        dependentSkillId: dependentId,
        weight: 2, // Required prerequisite
      });
      edgeCount++;
    }
  }
  console.log(`Created ${edgeCount} skill prerequisite edges`);
  
  // Seed year-end goals
  for (const goal of yearEndGoalDefs) {
    await db.insert(yearEndGoals).values({
      subject: goal.subject,
      grade: goal.grade,
      title: goal.title,
      description: goal.description,
      standardCode: goal.standardCode,
      orderInSubject: goal.orderInSubject,
    });
  }
  console.log(`Inserted ${yearEndGoalDefs.length} year-end goals`);
  
  // Create milestones for each strand
  let milestoneCount = 0;
  for (const [key, strandId] of Object.entries(insertedStrands)) {
    const [subject, grade, strandName] = key.split('-');
    
    // Create 2-3 milestones per strand
    const milestoneDefs = getMilestonesForStrand(subject, grade, strandName);
    
    for (const ms of milestoneDefs) {
      await db.insert(milestones).values({
        strandId: strandId,
        name: ms.name,
        description: ms.description,
        orderInStrand: ms.order,
        xpReward: ms.xpReward,
      });
      milestoneCount++;
    }
  }
  console.log(`Created ${milestoneCount} milestones`);
  
  console.log("Curriculum seeding complete!");
}

function getMilestonesForStrand(subject: string, grade: string, strandName: string): { name: string; description: string; order: number; xpReward: number }[] {
  // Generate appropriate milestones based on strand
  if (subject === "MATH") {
    if (strandName.includes("Counting")) {
      return [
        { name: "Count to 20 Master", description: "Can count to 20 fluently", order: 1, xpReward: 50 },
        { name: "Count to 100 Champion", description: "Can count to 100 with confidence", order: 2, xpReward: 100 },
      ];
    }
    if (strandName.includes("Addition") || strandName.includes("Operations")) {
      return [
        { name: "Addition Starter", description: "Can add simple numbers", order: 1, xpReward: 50 },
        { name: "Math Facts Master", description: "Knows addition facts fluently", order: 2, xpReward: 100 },
      ];
    }
    if (strandName.includes("Multiplication")) {
      return [
        { name: "Times Tables Beginner", description: "Knows 2s, 5s, and 10s", order: 1, xpReward: 75 },
        { name: "Multiplication Master", description: "Knows all facts to 100", order: 2, xpReward: 150 },
      ];
    }
  }
  
  if (subject === "READING") {
    if (strandName.includes("Phonological") || strandName.includes("Phonics")) {
      return [
        { name: "Sound Detective", description: "Can identify sounds in words", order: 1, xpReward: 50 },
        { name: "Decoding Pro", description: "Can decode unfamiliar words", order: 2, xpReward: 100 },
      ];
    }
    if (strandName.includes("Fluency")) {
      return [
        { name: "Smooth Reader", description: "Reads with accuracy", order: 1, xpReward: 75 },
        { name: "Expression Expert", description: "Reads with expression", order: 2, xpReward: 100 },
      ];
    }
  }
  
  if (subject === "CHARACTER") {
    return [
      { name: `${strandName} Learner`, description: `Understanding ${strandName.toLowerCase()}`, order: 1, xpReward: 50 },
      { name: `${strandName} Champion`, description: `Living out ${strandName.toLowerCase()}`, order: 2, xpReward: 100 },
    ];
  }
  
  // Default milestones
  return [
    { name: "Getting Started", description: "Beginning to learn this area", order: 1, xpReward: 50 },
    { name: "Making Progress", description: "Showing good understanding", order: 2, xpReward: 100 },
  ];
}
