import dotenv from '../backend/node_modules/dotenv/lib/main.js';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from '../backend/node_modules/mongoose/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

import { hashPassword } from '../backend/services/passwordService.js';
import User from '../backend/models/User.js';
import Student from '../backend/models/Student.js';
import Faculty from '../backend/models/Faculty.js';
import Mentor from '../backend/models/Mentor.js';
import Timetable from '../backend/models/Timetable.js';
import Attendance from '../backend/models/Attendance.js';
import Fee from '../backend/models/Fee.js';
import Exam from '../backend/models/Exam.js';
import Result from '../backend/models/Result.js';
import Complaint from '../backend/models/Complaint.js';
import Announcement from '../backend/models/Announcement.js';
import CampusEvent from '../backend/models/CampusEvent.js';
import Club from '../backend/models/Club.js';
import ClubMembership from '../backend/models/ClubMembership.js';
import LibraryBook from '../backend/models/LibraryBook.js';
import BusRoute from '../backend/models/BusRoute.js';
import TransportBus from '../backend/models/TransportBus.js';
import CampusLocation from '../backend/models/CampusLocation.js';
import AIKnowledgeBase from '../backend/models/AIKnowledgeBase.js';
import HostelStudent from '../backend/models/HostelStudent.js';
import QuestionPaper from '../backend/models/QuestionPaper.js';
import LostAndFound from '../backend/models/LostAndFound.js';
import Notification from '../backend/models/Notification.js';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in environment or .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log('✓ Connected to MongoDB Atlas.');

  const defaultPassword = 'Password@123';
  const hashedPw = await hashPassword(defaultPassword);
  const demoPw = await hashPassword('Demo@2026');

  // =========================================================================
  // 1. ADMIN USER
  // =========================================================================
  console.log('\n--- 1. Seeding Admin Users ---');
  let admin = await User.findOne({ email: 'admin@campushub.edu' });
  if (!admin) {
    admin = await User.create({
      email: 'admin@campushub.edu',
      passwordHash: hashedPw,
      role: 'admin',
      isActive: true,
    });
  }
  let demoAdmin = await User.findOne({ email: 'admin@demo.com' });
  if (!demoAdmin) {
    demoAdmin = await User.create({
      email: 'admin@demo.com',
      passwordHash: demoPw,
      role: 'admin',
      isActive: true,
    });
  }
  console.log('✓ Admin accounts verified.');

  // =========================================================================
  // 2. FACULTY MEMBERS (8+ Faculty)
  // =========================================================================
  console.log('\n--- 2. Seeding Faculty Members (8+) ---');
  const facultyData = [
    { email: 'faculty@campushub.edu', name: 'Dr. Rajesh Sharma', dept: 'CSE', desig: 'Associate Professor', empId: 'FAC102', phone: '+91 98765 43210', subjects: ['Data Structures & Algorithms', 'Operating Systems'] },
    { email: 'anita.desai@campushub.edu', name: 'Dr. Anita Desai', dept: 'CSE', desig: 'Professor & Head', empId: 'FAC103', phone: '+91 98765 43211', subjects: ['Database Management Systems', 'Cloud Computing'] },
    { email: 'senthil.kumar@campushub.edu', name: 'Prof. K. Senthil Kumar', dept: 'CSE', desig: 'Associate Professor', empId: 'FAC104', phone: '+91 98765 43212', subjects: ['Object-Oriented Software Eng.', 'Full Stack Development'] },
    { email: 'meenakshi.s@campushub.edu', name: 'Dr. Meenakshi Sundaram', dept: 'AI & DS', desig: 'Professor', empId: 'FAC105', phone: '+91 98765 43213', subjects: ['Machine Learning Foundations', 'Deep Learning'] },
    { email: 'arvind.s@campushub.edu', name: 'Prof. Arvind Swaminathan', dept: 'IT', desig: 'Assistant Professor', empId: 'FAC106', phone: '+91 98765 43214', subjects: ['Computer Networks', 'Network Security'] },
    { email: 'kavitha.r@campushub.edu', name: 'Dr. Kavitha Ramesh', dept: 'ECE', desig: 'Associate Professor', empId: 'FAC107', phone: '+91 98765 43215', subjects: ['Digital Principles & Microprocessors'] },
    { email: 'suresh.n@campushub.edu', name: 'Prof. Suresh Natarajan', dept: 'Mathematics', desig: 'Assistant Professor', empId: 'FAC108', phone: '+91 98765 43216', subjects: ['Discrete Mathematics & Graph Theory', 'Probability & Statistics'] },
    { email: 'lakshmi.n@campushub.edu', name: 'Dr. Lakshmi Narayanan', dept: 'Humanities', desig: 'Associate Professor', empId: 'FAC109', phone: '+91 98765 43217', subjects: ['Professional Ethics & Soft Skills'] },
    { email: 'faculty@demo.com', name: 'Dr. Rajesh Sharma (Demo)', dept: 'CSE', desig: 'Associate Professor', empId: 'DEMOFAC1', phone: '+91 98765 99991', subjects: ['Data Structures & Algorithms', 'Operating Systems'] },
  ];

  const facultyDocs = [];
  for (const f of facultyData) {
    let u = await User.findOne({ email: f.email });
    if (!u) {
      u = await User.create({
        email: f.email,
        passwordHash: f.email.includes('demo') ? demoPw : hashedPw,
        role: 'faculty',
        isActive: true,
      });
    }
    let facDoc = await Faculty.findOne({ $or: [{ userId: u._id }, { employeeId: f.empId }] });
    if (!facDoc) {
      facDoc = await Faculty.create({
        userId: u._id,
        name: f.name,
        department: f.dept,
        designation: f.desig,
        employeeId: f.empId,
        phone: f.phone,
        subjects: f.subjects,
        isActive: true,
      });
    } else {
      facDoc.userId = u._id;
      facDoc.name = f.name;
      facDoc.department = f.dept;
      facDoc.designation = f.desig;
      facDoc.phone = f.phone;
      facDoc.subjects = f.subjects;
      await facDoc.save();
    }
    facultyDocs.push(facDoc);
  }
  console.log(`✓ Seeded ${facultyDocs.length} faculty members.`);

  // =========================================================================
  // 3. MENTORS (4+ Mentors)
  // =========================================================================
  console.log('\n--- 3. Seeding Mentors (4+) ---');
  const mentorData = [
    { email: 'mentor@campushub.edu', name: 'Dr. Priya Raman', dept: 'CSE', desig: 'Associate Professor', empId: 'MEN204', phone: '+91 94441 23456' },
    { email: 'senthil.mentor@campushub.edu', name: 'Dr. K. Senthil Kumar', dept: 'CSE', desig: 'Associate Professor', empId: 'MEN205', phone: '+91 94441 23457' },
    { email: 'anita.mentor@campushub.edu', name: 'Dr. Anita Desai', dept: 'CSE', desig: 'Professor & Head', empId: 'MEN206', phone: '+91 94441 23458' },
    { email: 'arvind.mentor@campushub.edu', name: 'Prof. Arvind Swaminathan', dept: 'IT', desig: 'Assistant Professor', empId: 'MEN207', phone: '+91 94441 23459' },
    { email: 'mentor@demo.com', name: 'Dr. Priya Raman (Demo)', dept: 'CSE', desig: 'Associate Professor', empId: 'DEMOMEN1', phone: '+91 94441 99992' },
  ];

  const mentorDocs = [];
  for (const m of mentorData) {
    let u = await User.findOne({ email: m.email });
    if (!u) {
      u = await User.create({
        email: m.email,
        passwordHash: m.email.includes('demo') ? demoPw : hashedPw,
        role: 'mentor',
        isActive: true,
      });
    }
    let mDoc = await Mentor.findOne({ $or: [{ userId: u._id }, { employeeId: m.empId }] });
    if (!mDoc) {
      mDoc = await Mentor.create({
        userId: u._id,
        name: m.name,
        department: m.dept,
        designation: m.desig,
        employeeId: m.empId,
        phone: m.phone,
        email: m.email,
        isActive: true,
      });
    } else {
      mDoc.userId = u._id;
      mDoc.name = m.name;
      mDoc.department = m.dept;
      mDoc.designation = m.desig;
      mDoc.phone = m.phone;
      mDoc.email = m.email;
      await mDoc.save();
    }
    mentorDocs.push(mDoc);
  }
  console.log(`✓ Seeded ${mentorDocs.length} mentors.`);

  // =========================================================================
  // 4. MAINTENANCE & DRIVERS
  // =========================================================================
  console.log('\n--- 4. Seeding Maintenance and Drivers ---');
  let maintUser = await User.findOne({ email: 'maintenance@campushub.edu' });
  if (!maintUser) {
    maintUser = await User.create({
      email: 'maintenance@campushub.edu',
      passwordHash: hashedPw,
      role: 'maintenance',
      isActive: true,
    });
  }
  let demoMaint = await User.findOne({ email: 'maintenance@demo.com' });
  if (!demoMaint) {
    await User.create({ email: 'maintenance@demo.com', passwordHash: demoPw, role: 'maintenance', isActive: true });
  }

  // 10 Driver accounts
  const driverUsers = [];
  const driverNames = [
    'Ramesh Chandran', 'Murugan Velu', 'Selvam Arumugam', 'Palanisamy K.',
    'Dharmaraj S.', 'Sivakumar M.', 'Krishnan V.', 'Thirunavukkarasu P.',
    'Rajendran N.', 'Muthusamy T.'
  ];

  for (let i = 0; i < 10; i++) {
    const email = i === 0 ? 'driver@campushub.edu' : `driver${i + 1}@campushub.edu`;
    let u = await User.findOne({ email });
    if (!u) {
      u = await User.create({
        email,
        passwordHash: hashedPw,
        role: 'driver',
        isActive: true,
      });
    }
    driverUsers.push({ user: u, name: driverNames[i] });
  }
  let demoDriver = await User.findOne({ email: 'driver@demo.com' });
  if (!demoDriver) {
    demoDriver = await User.create({ email: 'driver@demo.com', passwordHash: demoPw, role: 'driver', isActive: true });
  }

  // =========================================================================
  // 5. BUS ROUTES & TRANSPORT BUSES (10 Routes & 10 Buses)
  // =========================================================================
  console.log('\n--- 5. Seeding 10 Transport Routes and Buses ---');
  const routeDefinitions = [
    {
      routeName: 'Salem Junction Express (Route 1)', origin: 'Salem Junction', destination: 'Campus Main Gate', distance: 24, duration: '45m',
      stops: [
        { name: 'Salem Junction Gate', order: 1, estimatedTime: '07:35', landmark: 'Platform 1 Exit' },
        { name: '5 Roads Circle', order: 2, estimatedTime: '07:45', landmark: 'Near ARRS Multiplex' },
        { name: 'New Bus Stand', order: 3, estimatedTime: '08:00', landmark: 'Bay 4 Entrance' },
        { name: 'Kandhampatti Bypass', order: 4, estimatedTime: '08:15', landmark: 'Toll plaza' },
        { name: 'Campus Main Gate', order: 5, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Attur Town Connector (Route 2)', origin: 'Attur Bus Stand', destination: 'Campus Main Gate', distance: 48, duration: '1h 10m',
      stops: [
        { name: 'Attur Bus Stand', order: 1, estimatedTime: '07:15', landmark: 'Main Clock Tower' },
        { name: 'Valapady Bypass', order: 2, estimatedTime: '07:40', landmark: 'Flyover Junction' },
        { name: 'Udayapatti', order: 3, estimatedTime: '08:10', landmark: 'Near Police Booth' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Omalur Line (Route 3)', origin: 'Omalur Main Bus Stand', destination: 'Campus Main Gate', distance: 18, duration: '35m',
      stops: [
        { name: 'Omalur Main Stand', order: 1, estimatedTime: '07:45', landmark: 'Government Hospital' },
        { name: 'Tharamangalam Pirivu', order: 2, estimatedTime: '08:00', landmark: 'Signal Point' },
        { name: 'Kottagoundampatti', order: 3, estimatedTime: '08:15', landmark: 'Panchayat Office' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Namakkal Express (Route 4)', origin: 'Namakkal Park Road', destination: 'Campus Main Gate', distance: 52, duration: '1h 15m',
      stops: [
        { name: 'Namakkal Park Road', order: 1, estimatedTime: '07:10', landmark: 'Fort Arch' },
        { name: 'Puduchatram', order: 2, estimatedTime: '07:35', landmark: 'Near Syndicate Bank' },
        { name: 'Rasipuram Bypass', order: 3, estimatedTime: '07:55', landmark: 'Overbridge' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Rasipuram Shuttle (Route 5)', origin: 'Rasipuram Old Stand', destination: 'Campus Main Gate', distance: 30, duration: '50m',
      stops: [
        { name: 'Rasipuram Old Stand', order: 1, estimatedTime: '07:30', landmark: 'Perumal Kovil' },
        { name: 'Andagalur Gate', order: 2, estimatedTime: '07:50', landmark: 'Bus Shelter' },
        { name: 'Mallur Junction', order: 3, estimatedTime: '08:10', landmark: 'Police Station' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Sankari Route (Route 6)', origin: 'Sankari Durg', destination: 'Campus Main Gate', distance: 38, duration: '55m',
      stops: [
        { name: 'Sankari Durg', order: 1, estimatedTime: '07:25', landmark: 'Fort Entrance' },
        { name: 'Magudanchavadi', order: 2, estimatedTime: '07:50', landmark: 'Toll plaza' },
        { name: 'Ariyanoor', order: 3, estimatedTime: '08:15', landmark: 'VMRF Junction' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Mettur Dam Line (Route 7)', origin: 'Mettur Square', destination: 'Campus Main Gate', distance: 45, duration: '1h 05m',
      stops: [
        { name: 'Mettur Square', order: 1, estimatedTime: '07:15', landmark: 'Park Entrance' },
        { name: 'Mecheri', order: 2, estimatedTime: '07:45', landmark: 'Bhadrakali Amman Temple' },
        { name: 'Nangavalli', order: 3, estimatedTime: '08:05', landmark: 'Bus Stop' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Dharmapuri Flyer (Route 8)', origin: 'Dharmapuri 4 Roads', destination: 'Campus Main Gate', distance: 60, duration: '1h 25m',
      stops: [
        { name: 'Dharmapuri 4 Roads', order: 1, estimatedTime: '07:00', landmark: 'Collectorate Junction' },
        { name: 'Thoppur Toll', order: 2, estimatedTime: '07:35', landmark: 'Ghat Section Entrance' },
        { name: 'Deevattipatti', order: 3, estimatedTime: '08:05', landmark: 'Near High School' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Edappadi Connector (Route 9)', origin: 'Edappadi Bus Stand', destination: 'Campus Main Gate', distance: 40, duration: '55m',
      stops: [
        { name: 'Edappadi Stand', order: 1, estimatedTime: '07:25', landmark: 'Municipality Office' },
        { name: 'Poolampatti', order: 2, estimatedTime: '07:45', landmark: 'Kaveri River Bridge' },
        { name: 'Jalakandapuram', order: 3, estimatedTime: '08:05', landmark: 'Town Bus Stop' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
    {
      routeName: 'Tiruchengode Line (Route 10)', origin: 'Tiruchengode Bus Stand', destination: 'Campus Main Gate', distance: 42, duration: '1h 00m',
      stops: [
        { name: 'Tiruchengode Stand', order: 1, estimatedTime: '07:20', landmark: 'Hill Temple Base' },
        { name: 'KSR Kalvi Nagar', order: 2, estimatedTime: '07:40', landmark: 'College Arch' },
        { name: 'Sankari West', order: 3, estimatedTime: '08:05', landmark: 'Railway Overpass' },
        { name: 'Campus Main Gate', order: 4, estimatedTime: '08:35', landmark: 'North Gate' },
      ],
    },
  ];

  const busDocs = [];
  for (let i = 0; i < routeDefinitions.length; i++) {
    const rDef = routeDefinitions[i];
    let route = await BusRoute.findOne({ routeName: rDef.routeName });
    if (!route) {
      route = await BusRoute.create({ ...rDef, isActive: true });
    }

    const busNumber = `BUS-${String(i + 1).padStart(2, '0')}`;
    const driverInfo = driverUsers[i];
    let bus = await TransportBus.findOne({ busNumber });
    if (!bus) {
      bus = await TransportBus.create({
        busNumber,
        routeId: route._id,
        driverId: i === 0 ? demoDriver._id : driverInfo.user._id,
        driverName: driverInfo.name,
        capacity: 52,
        status: i === 0 ? 'on_trip' : 'active',
        currentLocation: {
          latitude: 11.6643 + (i * 0.01),
          longitude: 78.1460 + (i * 0.01),
          locationName: rDef.stops[1]?.name || 'On Route',
          updatedAt: new Date(),
        },
        vehicleModel: 'Ashok Leyland 52-Seater Campus Coach',
        registrationNo: `TN-30-CH-${2020 + i}`,
      });
    }
    busDocs.push(bus);
  }
  console.log(`✓ Seeded ${busDocs.length} transport buses and routes.`);

  // =========================================================================
  // 6. STUDENTS (20+ Students: 21CS001 to 21CS020)
  // =========================================================================
  console.log('\n--- 6. Seeding 20 Students (21CS001 - 21CS020) ---');
  const studentSeedData = [
    { regNo: '21CS001', name: 'Aarav Patel', email: 'student@campushub.edu', hostel: 'hosteller', busIdx: null, room: '304', block: 'Kaveri Boys Hostel', mentorIdx: 0 },
    { regNo: '21CS002', name: 'Sneha Reddy', email: 'sneha.reddy@campushub.edu', hostel: 'day_scholar', busIdx: 0, room: null, block: null, mentorIdx: 0 },
    { regNo: '21CS003', name: 'Vikram Singh', email: 'vikram.singh@campushub.edu', hostel: 'hosteller', busIdx: null, room: '208', block: 'Kaveri Boys Hostel', mentorIdx: 0 },
    { regNo: '21CS004', name: 'Ananya Iyer', email: 'ananya.iyer@campushub.edu', hostel: 'day_scholar', busIdx: 1, room: null, block: null, mentorIdx: 0 },
    { regNo: '21CS005', name: 'Rohan Gupta', email: 'rohan.gupta@campushub.edu', hostel: 'hosteller', busIdx: null, room: '112', block: 'Kaveri Boys Hostel', mentorIdx: 0 },
    { regNo: '21CS006', name: 'Divya Balaji', email: 'divya.balaji@campushub.edu', hostel: 'day_scholar', busIdx: 2, room: null, block: null, mentorIdx: 1 },
    { regNo: '21CS007', name: 'Karthik Raja', email: 'karthik.raja@campushub.edu', hostel: 'hosteller', busIdx: null, room: '315', block: 'Bhavani Boys Hostel', mentorIdx: 1 },
    { regNo: '21CS008', name: 'Meera Nambiar', email: 'meera.nambiar@campushub.edu', hostel: 'day_scholar', busIdx: 3, room: null, block: null, mentorIdx: 1 },
    { regNo: '21CS009', name: 'Sanjay Kumar', email: 'sanjay.kumar@campushub.edu', hostel: 'hosteller', busIdx: null, room: '104', block: 'Bhavani Boys Hostel', mentorIdx: 1 },
    { regNo: '21CS010', name: 'Pooja Hegde', email: 'pooja.hegde@campushub.edu', hostel: 'day_scholar', busIdx: 4, room: null, block: null, mentorIdx: 1 },
    { regNo: '21CS011', name: 'Ashwin Venkatesh', email: 'ashwin.v@campushub.edu', hostel: 'hosteller', busIdx: null, room: '402', block: 'Ganga Boys Hostel', mentorIdx: 2 },
    { regNo: '21CS012', name: 'Rithika Menon', email: 'rithika.m@campushub.edu', hostel: 'day_scholar', busIdx: 5, room: null, block: null, mentorIdx: 2 },
    { regNo: '21CS013', name: 'Pranav Nair', email: 'pranav.nair@campushub.edu', hostel: 'hosteller', busIdx: null, room: '220', block: 'Ganga Boys Hostel', mentorIdx: 2 },
    { regNo: '21CS014', name: 'Shalini Murugan', email: 'shalini.m@campushub.edu', hostel: 'day_scholar', busIdx: 6, room: null, block: null, mentorIdx: 2 },
    { regNo: '21CS015', name: 'Harish Kalyan', email: 'harish.k@campushub.edu', hostel: 'hosteller', busIdx: null, room: '108', block: 'Ganga Boys Hostel', mentorIdx: 2 },
    { regNo: '21CS016', name: 'Keerthi Suresh', email: 'keerthi.s@campushub.edu', hostel: 'day_scholar', busIdx: 7, room: null, block: null, mentorIdx: 3 },
    { regNo: '21CS017', name: 'Naveen Prabhu', email: 'naveen.p@campushub.edu', hostel: 'hosteller', busIdx: null, room: '312', block: 'Kaveri Boys Hostel', mentorIdx: 3 },
    { regNo: '21CS018', name: 'Bhavana Krishnan', email: 'bhavana.k@campushub.edu', hostel: 'day_scholar', busIdx: 8, room: null, block: null, mentorIdx: 3 },
    { regNo: '21CS019', name: 'Manoj Selvam', email: 'manoj.s@campushub.edu', hostel: 'hosteller', busIdx: null, room: '214', block: 'Bhavani Boys Hostel', mentorIdx: 3 },
    { regNo: '21CS020', name: 'Deepa Lakshmi', email: 'deepa.l@campushub.edu', hostel: 'day_scholar', busIdx: 9, room: null, block: null, mentorIdx: 3 },
  ];

  const studentDocs = [];
  for (const st of studentSeedData) {
    let u = await User.findOne({ email: st.email });
    if (!u) {
      u = await User.create({
        email: st.email,
        passwordHash: hashedPw,
        role: 'student',
        isActive: true,
      });
    }

    const assignedMentor = mentorDocs[st.mentorIdx] || mentorDocs[0];
    const assignedBus = st.busIdx !== null ? busDocs[st.busIdx] : null;

    let sDoc = await Student.findOne({ $or: [{ userId: u._id }, { regNo: st.regNo }, { registrationNumber: st.regNo }] });
    if (!sDoc) {
      sDoc = await Student.create({
        userId: u._id,
        regNo: st.regNo,
        registrationNumber: st.regNo,
        name: st.name,
        department: 'CSE',
        year: 2,
        semester: 3,
        section: 'A',
        batch: '2024-2028',
        college: 'CampusHub Engineering College',
        phone: `+91 91234 ${50000 + studentDocs.length}`,
        parentPhone: `+91 98765 ${40000 + studentDocs.length}`,
        address: st.hostel === 'hosteller' ? `Room ${st.room}, ${st.block}` : '12 Gandhi Street, Salem, Tamil Nadu',
        bloodGroup: 'O+',
        hostelStatus: st.hostel,
        transportEligible: st.hostel === 'day_scholar',
        busNumber: assignedBus ? assignedBus.busNumber : '',
        busRoute: assignedBus ? routeDefinitions[st.busIdx].routeName : '',
        pickupPoint: assignedBus ? routeDefinitions[st.busIdx].stops[1].name : '',
        mentorId: assignedMentor._id,
        isActive: true,
      });
    } else {
      sDoc.regNo = st.regNo;
      sDoc.registrationNumber = st.regNo;
      sDoc.hostelStatus = st.hostel;
      sDoc.transportEligible = st.hostel === 'day_scholar';
      sDoc.busNumber = assignedBus ? assignedBus.busNumber : '';
      sDoc.busRoute = assignedBus ? routeDefinitions[st.busIdx].routeName : '';
      sDoc.pickupPoint = assignedBus ? routeDefinitions[st.busIdx].stops[1].name : '';
      sDoc.mentorId = assignedMentor._id;
      await sDoc.save();
    }

    // Link student to bus enrolled list if day scholar
    if (assignedBus) {
      await TransportBus.findByIdAndUpdate(assignedBus._id, {
        $addToSet: { enrolledStudentIds: sDoc._id }
      });
    }

    // Create hostel student record if hosteller
    if (st.hostel === 'hosteller') {
      const hExists = await HostelStudent.findOne({ studentId: sDoc._id });
      if (!hExists) {
        await HostelStudent.create({
          studentId: sDoc._id,
          roomNumber: st.room,
          blockName: st.block,
          floorNumber: parseInt(st.room[0]),
          roomType: 'double',
          wardenName: 'Dr. V. Ramanathan',
          wardenPhone: '+91 98401 23456',
          wardenEmail: 'warden@campushub.edu',
          joinDate: new Date('2024-08-01'),
          isActive: true,
        });
      }
    }

    studentDocs.push(sDoc);
  }

  // Demo student accounts linked to 21CS001 and 21CS002
  let demoS1 = await User.findOne({ email: 'student@demo.com' });
  if (!demoS1) {
    demoS1 = await User.create({ email: 'student@demo.com', passwordHash: demoPw, role: 'student', isActive: true });
  }
  let demoS1Profile = await Student.findOne({ userId: demoS1._id });
  if (!demoS1Profile) {
    await Student.create({
      userId: demoS1._id,
      regNo: '21CS001',
      registrationNumber: '21CS001',
      name: 'Aarav Patel (Demo)',
      department: 'CSE',
      year: 2,
      semester: 3,
      section: 'A',
      batch: '2024-2028',
      college: 'CampusHub Engineering College',
      phone: '+91 91234 56789',
      parentPhone: '+91 98765 43210',
      address: 'Room 304, Kaveri Boys Hostel, Campus',
      bloodGroup: 'O+',
      hostelStatus: 'hosteller',
      transportEligible: false,
      mentorId: mentorDocs[0]._id,
      isActive: true,
    });
  }

  let demoS2 = await User.findOne({ email: 'student2@demo.com' });
  if (!demoS2) {
    demoS2 = await User.create({ email: 'student2@demo.com', passwordHash: demoPw, role: 'student', isActive: true });
  }
  let demoS2Profile = await Student.findOne({ userId: demoS2._id });
  if (!demoS2Profile) {
    await Student.create({
      userId: demoS2._id,
      regNo: '21CS002',
      registrationNumber: '21CS002',
      name: 'Sneha Reddy (Demo)',
      department: 'CSE',
      year: 2,
      semester: 3,
      section: 'A',
      batch: '2024-2028',
      college: 'CampusHub Engineering College',
      phone: '+91 91234 56790',
      parentPhone: '+91 98765 43211',
      address: '15 Anna Nagar, Salem',
      bloodGroup: 'B+',
      hostelStatus: 'day_scholar',
      transportEligible: true,
      busNumber: 'BUS-01',
      busRoute: 'Salem Junction Express (Route 1)',
      pickupPoint: '5 Roads Circle',
      mentorId: mentorDocs[0]._id,
      isActive: true,
    });
  }
  console.log(`✓ Seeded ${studentDocs.length} registered students.`);

  // =========================================================================
  // 7. TIMETABLE (Mon - Sat, 8 periods per day)
  // =========================================================================
  console.log('\n--- 7. Seeding Full Mon-Sat Timetable (Periods 1-8) ---');
  const periodSchedule = [
    { period: 1, startTime: '08:45', endTime: '09:35' },
    { period: 2, startTime: '09:35', endTime: '10:25' },
    { period: 3, startTime: '10:40', endTime: '11:30' },
    { period: 4, startTime: '11:30', endTime: '12:20' },
    { period: 5, startTime: '01:15', endTime: '02:05' },
    { period: 6, startTime: '02:05', endTime: '02:55' },
    { period: 7, startTime: '02:55', endTime: '03:45' },
    { period: 8, startTime: '03:45', endTime: '04:30' },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const subjectsPool = [
    { code: 'CS3301', name: 'Data Structures & Algorithms', faculty: 'Dr. Rajesh Sharma', room: 'LH-201' },
    { code: 'CS3302', name: 'Operating Systems', faculty: 'Dr. Rajesh Sharma', room: 'LH-201' },
    { code: 'CS3303', name: 'Database Management Systems', faculty: 'Dr. Anita Desai', room: 'LH-202' },
    { code: 'CS3304', name: 'Cloud Computing', faculty: 'Dr. Anita Desai', room: 'Lab-3' },
    { code: 'CS3305', name: 'Computer Networks', faculty: 'Prof. Arvind Swaminathan', room: 'LH-203' },
    { code: 'CS3306', name: 'Object-Oriented Software Eng.', faculty: 'Prof. K. Senthil Kumar', room: 'LH-201' },
    { code: 'AI3301', name: 'Machine Learning Foundations', faculty: 'Dr. Meenakshi Sundaram', room: 'AI-Lab' },
    { code: 'EC3301', name: 'Digital Principles & Microproc.', faculty: 'Dr. Kavitha Ramesh', room: 'EC-Lab' },
    { code: 'MA3301', name: 'Discrete Mathematics', faculty: 'Prof. Suresh Natarajan', room: 'LH-202' },
    { code: 'HS3301', name: 'Professional Ethics', faculty: 'Dr. Lakshmi Narayanan', room: 'LH-204' },
  ];

  const fullSlots = [];
  let sIdx = 0;
  for (const day of days) {
    for (const p of periodSchedule) {
      const sub = subjectsPool[sIdx % subjectsPool.length];
      fullSlots.push({
        day,
        period: p.period,
        startTime: p.startTime,
        endTime: p.endTime,
        subject: sub.name,
        subjectCode: sub.code,
        facultyName: sub.faculty,
        room: sub.room,
      });
      sIdx++;
    }
  }

  await Timetable.deleteMany({ department: 'CSE', year: 2, semester: 3, section: 'A' });
  await Timetable.create({
    department: 'CSE',
    year: 2,
    semester: 3,
    section: 'A',
    academicYear: '2025-2026',
    effectiveFrom: new Date('2025-07-01'),
    createdBy: admin._id,
    slots: fullSlots,
  });
  console.log(`✓ Seeded CSE 2nd Year Timetable: 6 days x 8 periods = ${fullSlots.length} slots.`);

  // =========================================================================
  // 8. ATTENDANCE (Periods 1-8 across students)
  // =========================================================================
  console.log('\n--- 8. Seeding Attendance Records (Periods 1-8) ---');
  const pastDates = [
    new Date(Date.now() - 4 * 86400000),
    new Date(Date.now() - 3 * 86400000),
    new Date(Date.now() - 2 * 86400000),
    new Date(Date.now() - 1 * 86400000),
    new Date(),
  ];

  const attendanceBatch = [];
  for (const student of studentDocs) {
    for (const date of pastDates) {
      for (let period = 1; period <= 8; period++) {
        const sub = subjectsPool[(period - 1) % subjectsPool.length];
        const isAbsent = Math.random() < 0.1; // 90% attendance rate
        attendanceBatch.push({
          studentId: student._id,
          subject: sub.name,
          subjectCode: sub.code,
          date,
          status: isAbsent ? 'absent' : 'present',
          department: 'CSE',
          year: 2,
          semester: 3,
          section: 'A',
          period,
          markedBy: facultyDocs[0]?.userId || admin._id,
        });
      }
    }
  }

  await Attendance.deleteMany({ department: 'CSE', year: 2, semester: 3, section: 'A' });
  await Attendance.insertMany(attendanceBatch);
  console.log(`✓ Seeded ${attendanceBatch.length} attendance period records.`);

  // =========================================================================
  // 9. FEES (Semester 3 Fees for all 20 Students)
  // =========================================================================
  console.log('\n--- 9. Seeding Fees & Transactions ---');
  await Fee.deleteMany({});
  for (let i = 0; i < studentDocs.length; i++) {
    const student = studentDocs[i];
    const isHosteller = student.hostelStatus === 'hosteller';
    const tuition = 50000;
    const hostelFee = isHosteller ? 35000 : 0;
    const transportFee = isHosteller ? 0 : 15000;
    const labFee = 6000;
    const examFee = 3000;
    const otherFee = 2000;
    const total = tuition + hostelFee + transportFee + labFee + examFee + otherFee;

    // Student 1 (Aarav Patel): Partial payment
    // Others: mix of paid, partial, pending
    let paid = 0;
    let transactions = [];
    if (i === 0) {
      paid = 50000;
      transactions.push({
        amount: 50000,
        date: new Date(Date.now() - 30 * 86400000),
        referenceNo: 'TXN-98234120',
        method: 'Online',
        description: 'First Installment via CampusHub NetBanking',
      });
    } else if (i % 3 === 0) {
      paid = total;
      transactions.push({
        amount: total,
        date: new Date(Date.now() - 45 * 86400000),
        referenceNo: `TXN-${80000000 + i}`,
        method: 'UPI',
        description: 'Full Semester Fee Paid via UPI',
      });
    } else if (i % 3 === 1) {
      paid = Math.round(total / 2);
      transactions.push({
        amount: paid,
        date: new Date(Date.now() - 20 * 86400000),
        referenceNo: `TXN-${80000000 + i}`,
        method: 'Card',
        description: 'Term 1 Settlement',
      });
    } else {
      paid = 0;
    }

    const due = total - paid;
    const status = due === 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';

    await Fee.create({
      studentId: student._id,
      regNo: student.regNo,
      registrationNumber: student.regNo,
      semester: 3,
      academicYear: '2025-2026',
      tuitionFee: tuition,
      hostelFee,
      transportFee,
      labFee,
      examFee,
      otherFee,
      totalFee: total,
      paidAmount: paid,
      dueAmount: due,
      status,
      dueDate: new Date(Date.now() + 25 * 86400000),
      transactionHistory: transactions,
      lastUpdatedBy: admin._id,
    });
  }
  console.log(`✓ Seeded ${studentDocs.length} student Fee records with transaction history.`);

  // =========================================================================
  // 10. EXAMS & RESULTS
  // =========================================================================
  console.log('\n--- 10. Seeding Exams and Results ---');
  await Exam.deleteMany({});
  await Result.deleteMany({});

  const examList = [
    { subject: 'Data Structures & Algorithms', subjectCode: 'CS3301', examType: 'internal', maxMark: 100, venue: 'Block B - Hall 1' },
    { subject: 'Operating Systems', subjectCode: 'CS3302', examType: 'internal', maxMark: 100, venue: 'Block B - Hall 2' },
    { subject: 'Database Management Systems', subjectCode: 'CS3303', examType: 'internal', maxMark: 100, venue: 'Block B - Hall 3' },
    { subject: 'Cloud Computing', subjectCode: 'CS3304', examType: 'internal', maxMark: 100, venue: 'Tech Park - Hall 101' },
    { subject: 'Discrete Mathematics', subjectCode: 'MA3301', examType: 'model', maxMark: 100, venue: 'Main Auditorium' },
  ];

  const createdExams = [];
  for (let i = 0; i < examList.length; i++) {
    const e = examList[i];
    const examDoc = await Exam.create({
      subject: e.subject,
      subjectCode: e.subjectCode,
      examType: e.examType,
      department: 'CSE',
      year: 2,
      semester: 3,
      section: 'A',
      date: new Date(Date.now() + (i + 3) * 86400000),
      startTime: '10:00',
      endTime: '12:00',
      venue: e.venue,
      maxMark: e.maxMark,
      isPublished: true,
      createdBy: admin._id,
    });
    createdExams.push(examDoc);
  }

  // Published Results for Semester 2
  const grades = [
    { grade: 'O', point: 10, marks: 95 },
    { grade: 'A+', point: 9, marks: 88 },
    { grade: 'A', point: 8, marks: 81 },
    { grade: 'B+', point: 7, marks: 74 },
  ];

  for (let i = 0; i < studentDocs.length; i++) {
    const g = grades[i % grades.length];
    await Result.create({
      studentId: studentDocs[i]._id,
      examId: createdExams[0]._id,
      subject: 'Data Structures & Algorithms',
      subjectCode: 'CS3301',
      semester: 2,
      academicYear: '2024-2025',
      marksObtained: g.marks,
      maxMarks: 100,
      grade: g.grade,
      gradePoint: g.point,
      result: 'pass',
      isPublished: true,
      publishedBy: admin._id,
    });
  }
  console.log(`✓ Seeded Exams and published results for all students.`);

  // =========================================================================
  // 11. 100+ LIBRARY BOOKS
  // =========================================================================
  console.log('\n--- 11. Seeding 100+ Library Books ---');
  await LibraryBook.deleteMany({});
  const bookTemplates = [
    { t: 'Introduction to Algorithms (CLRS)', a: 'Thomas Cormen, Charles Leiserson', c: 'Computer Science', s: 'CS' },
    { t: 'Clean Code: A Handbook of Agile Software Craftsmanship', a: 'Robert C. Martin', c: 'Software Engineering', s: 'SE' },
    { t: 'Design Patterns: Elements of Reusable Object-Oriented Software', a: 'Erich Gamma, Richard Helm', c: 'Software Engineering', s: 'SE' },
    { t: 'Operating System Concepts (Silberschatz)', a: 'Abraham Silberschatz, Peter Galvin', c: 'Operating Systems', s: 'OS' },
    { t: 'Computer Networks: A Systems Approach', a: 'Larry Peterson, Bruce Davie', c: 'Networking', s: 'NW' },
    { t: 'Database System Concepts', a: 'Abraham Silberschatz, Henry Korth', c: 'Databases', s: 'DB' },
    { t: 'Artificial Intelligence: A Modern Approach', a: 'Stuart Russell, Peter Norvig', c: 'AI & Data Science', s: 'AI' },
    { t: 'Deep Learning', a: 'Ian Goodfellow, Yoshua Bengio', c: 'AI & Data Science', s: 'AI' },
    { t: 'The Pragmatic Programmer', a: 'Andrew Hunt, David Thomas', c: 'Software Engineering', s: 'SE' },
    { t: 'Computer Organization and Design (RISC-V Edition)', a: 'David Patterson, John Hennessy', c: 'Hardware & Architecture', s: 'HW' },
    { t: 'Modern Operating Systems', a: 'Andrew S. Tanenbaum', c: 'Operating Systems', s: 'OS' },
    { t: 'Compilers: Principles, Techniques, and Tools (Dragon Book)', a: 'Alfred Aho, Monica Lam', c: 'Computer Science', s: 'CS' },
    { t: 'Cloud Computing: Concepts, Technology & Architecture', a: 'Thomas Erl, Ricardo Puttini', c: 'Cloud Computing', s: 'CL' },
    { t: 'Docker Deep Dive', a: 'Nigel Poulton', c: 'DevOps & Cloud', s: 'DO' },
    { t: 'Kubernetes in Action', a: 'Marko Luksa', c: 'DevOps & Cloud', s: 'DO' },
    { t: 'Designing Data-Intensive Applications', a: 'Martin Kleppmann', c: 'Databases', s: 'DB' },
    { t: 'The Linux Programming Interface', a: 'Michael Kerrisk', c: 'Operating Systems', s: 'OS' },
    { t: 'Cracking the Coding Interview', a: 'Gayle Laakmann McDowell', c: 'Career & Algorithms', s: 'CA' },
    { t: 'Python Crash Course', a: 'Eric Matthes', c: 'Programming', s: 'PR' },
    { t: 'Learning React: Modern Patterns for Developing React Apps', a: 'Alex Banks, Eve Porcello', c: 'Web Development', s: 'WD' },
    { t: 'Node.js Design Patterns', a: 'Mario Casciaro, Luciano Mammino', c: 'Web Development', s: 'WD' },
    { t: 'Practical Malware Analysis', a: 'Michael Sikorski, Andrew Honig', c: 'Cybersecurity', s: 'CY' },
    { t: 'The Web Application Hacker\'s Handbook', a: 'Dafydd Stuttard, Marcus Pinto', c: 'Cybersecurity', s: 'CY' },
    { t: 'Discrete Mathematics and Its Applications', a: 'Kenneth H. Rosen', c: 'Mathematics', s: 'MA' },
    { t: 'Linear Algebra and Its Applications', a: 'Gilbert Strang', c: 'Mathematics', s: 'MA' },
  ];

  const libraryBooks = [];
  let bCount = 1;
  // Generate 105 books by expanding templates across editions/volumes
  for (let round = 1; round <= 5; round++) {
    for (const b of bookTemplates) {
      if (bCount > 105) break;
      const title = round === 1 ? b.t : `${b.t} (Edition ${round})`;
      const total = 5 + (bCount % 8);
      const avail = Math.max(1, total - (bCount % 4));
      libraryBooks.push({
        title,
        author: b.a,
        isbn: `978-81-${100000 + bCount}-${bCount % 10}`,
        bookId: `BK-${b.s}-${String(bCount).padStart(3, '0')}`,
        category: b.c,
        totalCopies: total,
        availableCopies: avail,
        shelf: `${b.s}-${(bCount % 5) + 1}`,
        isActive: true,
      });
      bCount++;
    }
  }

  await LibraryBook.insertMany(libraryBooks);
  console.log(`✓ Seeded ${libraryBooks.length} Library Books.`);

  // =========================================================================
  // 12. 8+ CLUBS & MEMBERSHIPS
  // =========================================================================
  console.log('\n--- 12. Seeding 8+ Campus Clubs & Memberships ---');
  await Club.deleteMany({});
  await ClubMembership.deleteMany({});

  const clubsList = [
    { name: 'Google Developer Student Club (GDSC)', category: 'technical', coordinator: 'Dr. Rajesh Sharma', desc: 'Hands-on projects in Android, Cloud, AI, and Web.' },
    { name: 'Robotics & Automation Club', category: 'technical', coordinator: 'Dr. Kavitha Ramesh', desc: 'Autonomous drones, micro-controllers, and rover engineering.' },
    { name: 'Cyber Security & Ethical Hacking Society', category: 'technical', coordinator: 'Prof. Arvind Swaminathan', desc: 'Capture The Flag (CTF) competitions, reverse engineering, and threat analysis.' },
    { name: 'AI & Data Science Guild', category: 'technical', coordinator: 'Dr. Meenakshi Sundaram', desc: 'Exploring Large Language Models, Kaggle competitions, and computer vision.' },
    { name: 'ACM & Coding Club', category: 'technical', coordinator: 'Prof. K. Senthil Kumar', desc: 'Competitive programming, algorithmic challenges, and LeetCode hackathons.' },
    { name: 'Literary & Debating Society', category: 'cultural', coordinator: 'Dr. Lakshmi Narayanan', desc: 'Parliamentary debates, creative writing, elocution, and book discussions.' },
    { name: 'Music & Fine Arts Club (Raaga)', category: 'cultural', coordinator: 'Dr. Priya Raman', desc: 'Vocal music, classical dance, instrumental band, and stage theater.' },
    { name: 'Rotaract Youth Wing & Social Club', category: 'social', coordinator: 'Prof. Suresh Natarajan', desc: 'Community outreach, blood donation drives, and tree planting initiatives.' },
  ];

  const clubDocs = [];
  for (const c of clubsList) {
    const cDoc = await Club.create({
      name: c.name,
      description: c.desc,
      category: c.category,
      coordinator: c.coordinator,
      presidentName: 'Aarav Patel',
      memberIds: studentDocs.slice(1, 6).map(s => s._id),
      memberCount: 25 + Math.floor(Math.random() * 50),
      isActive: true,
    });
    clubDocs.push(cDoc);

  }
  console.log(`✓ Seeded ${clubDocs.length} campus clubs and memberships.`);

  // =========================================================================
  // 13. CAMPUS EVENTS & ANNOUNCEMENTS
  // =========================================================================
  console.log('\n--- 13. Seeding Events and Announcements ---');
  await CampusEvent.deleteMany({});
  await CampusEvent.insertMany([
    {
      name: 'Smart Campus Hackathon 2026',
      description: '36-hour continuous hackathon on building AI and IoT solutions for modern college campuses. Prizes worth Rs. 2,50,000.',
      category: 'hackathon',
      venue: 'Auditorium - Tech Park',
      date: new Date(Date.now() + 10 * 86400000),
      endDate: new Date(Date.now() + 12 * 86400000),
      registrationDeadline: new Date(Date.now() + 7 * 86400000),
      organizer: 'GDSC & ACM Chapter',
      isPublished: true,
    },
    {
      name: 'International Conference on Next-Gen Computing (ICNGC)',
      description: 'Keynote speakers from Google Research, Microsoft, and IISc Bangalore on scalable architectures.',
      category: 'seminar',
      venue: 'Main Seminar Hall - Block A',
      date: new Date(Date.now() + 20 * 86400000),
      endDate: new Date(Date.now() + 21 * 86400000),
      registrationDeadline: new Date(Date.now() + 15 * 86400000),
      organizer: 'Department of Computer Science',
      isPublished: true,
    },
    {
      name: 'Spring Cultural Festival "Dhwani 2026"',
      description: 'Annual inter-collegiate cultural fest featuring battle of bands, classical dance, and celebrity night.',
      category: 'cultural',
      venue: 'Open Air Amphitheatre',
      date: new Date(Date.now() + 30 * 86400000),
      endDate: new Date(Date.now() + 32 * 86400000),
      registrationDeadline: new Date(Date.now() + 25 * 86400000),
      organizer: 'Student Council',
      isPublished: true,
    },
  ]);

  await Announcement.deleteMany({});
  const announcementsList = [
    { title: 'Semester Mid-Term Examinations Notification', body: 'The mid-term examination timetable for 2nd and 3rd year engineering students has been uploaded to CampusHub portal.', cat: 'academic', p: 'high' },
    { title: 'Campus TechFest & Hackathon 2026 Registration Open', body: 'Registrations are open for the annual 36-hour Hackathon. Prizes worth 2 Lakhs. Form teams of 3 to 4.', cat: 'event', p: 'normal' },
    { title: 'College Bus Route 7 Timings Revision', body: 'Mettur Dam Line departure moved forward by 10 minutes starting next Monday due to road maintenance on NH-44.', cat: 'transport', p: 'normal' },
    { title: 'Hostel Evening Study Hours Guidelines', body: 'Mandatory study hours in Kaveri and Ganga hostels will be observed from 8:30 PM to 10:30 PM.', cat: 'hostel', p: 'normal' },
    { title: 'Library Weekend Extended Hours', body: 'Dr. APJ Abdul Kalam Library will remain open until 9:00 PM on Saturdays for exam preparation.', cat: 'academic', p: 'low' },
    { title: 'TCS & Infosys Campus Placement Drive for Pre-Final Years', body: 'Orientation session for national qualifier test is scheduled for this Friday at 3:00 PM in the auditorium.', cat: 'placement', p: 'high' },
    { title: 'Campus Wi-Fi Upgrade & Credential Reset', body: 'New 10 Gbps Wi-Fi 6 access points installed across academic blocks. Log in using your student email.', cat: 'general', p: 'normal' },
    { title: 'Annual Sports Meet Trials (Track and Field)', body: 'Selection trials for 100m, 400m, relay, and basketball will be held this Wednesday at 4:30 PM at the campus ground.', cat: 'event', p: 'low' },
    { title: 'Blood Donation Camp by Rotaract Wing', body: 'Voluntary blood donation camp organized in collaboration with Salem Blood Bank at the Medical Center.', cat: 'general', p: 'normal' },
    { title: 'Fee Payment Due Date Reminder for Semester 3', body: 'Last date to pay Semester 3 tuition dues without penalty is the 25th of this month. Pay online via CampusHub.', cat: 'fee', p: 'high' },
  ];

  for (const a of announcementsList) {
    await Announcement.create({
      title: a.title,
      body: a.body,
      category: a.cat,
      priority: a.p,
      audience: { type: 'everyone' },
      createdBy: admin._id,
      isPublished: true,
    });
  }
  console.log(`✓ Seeded Events and 10 Announcements.`);

  // =========================================================================
  // 14. 20+ QUESTION PAPERS
  // =========================================================================
  console.log('\n--- 14. Seeding 20+ Question Papers ---');
  await QuestionPaper.deleteMany({});
  const qpList = [
    { sub: 'Data Structures & Algorithms', code: 'CS3301', sem: 3, yr: 2024, type: 'semester', name: 'CS3301-Nov2024-Semester.pdf' },
    { sub: 'Data Structures & Algorithms', code: 'CS3301', sem: 3, yr: 2024, type: 'model', name: 'CS3301-Oct2024-Model.pdf' },
    { sub: 'Data Structures & Algorithms', code: 'CS3301', sem: 3, yr: 2023, type: 'semester', name: 'CS3301-Nov2023-Semester.pdf' },
    { sub: 'Operating Systems', code: 'CS3302', sem: 3, yr: 2024, type: 'semester', name: 'CS3302-Nov2024-Semester.pdf' },
    { sub: 'Operating Systems', code: 'CS3302', sem: 3, yr: 2024, type: 'internal', name: 'CS3302-Internal1.pdf' },
    { sub: 'Operating Systems', code: 'CS3302', sem: 3, yr: 2023, type: 'semester', name: 'CS3302-Nov2023-Semester.pdf' },
    { sub: 'Database Management Systems', code: 'CS3303', sem: 3, yr: 2024, type: 'semester', name: 'CS3303-Nov2024-Semester.pdf' },
    { sub: 'Database Management Systems', code: 'CS3303', sem: 3, yr: 2024, type: 'model', name: 'CS3303-Model2024.pdf' },
    { sub: 'Database Management Systems', code: 'CS3303', sem: 3, yr: 2023, type: 'semester', name: 'CS3303-Nov2023-Semester.pdf' },
    { sub: 'Cloud Computing', code: 'CS3304', sem: 3, yr: 2024, type: 'semester', name: 'CS3304-Nov2024-Semester.pdf' },
    { sub: 'Cloud Computing', code: 'CS3304', sem: 3, yr: 2024, type: 'internal', name: 'CS3304-Internal2.pdf' },
    { sub: 'Computer Networks', code: 'CS3305', sem: 3, yr: 2024, type: 'semester', name: 'CS3305-Nov2024-Semester.pdf' },
    { sub: 'Computer Networks', code: 'CS3305', sem: 3, yr: 2023, type: 'semester', name: 'CS3305-Nov2023-Semester.pdf' },
    { sub: 'Discrete Mathematics', code: 'MA3301', sem: 3, yr: 2024, type: 'semester', name: 'MA3301-Nov2024-Semester.pdf' },
    { sub: 'Discrete Mathematics', code: 'MA3301', sem: 3, yr: 2024, type: 'model', name: 'MA3301-Model2024.pdf' },
    { sub: 'Discrete Mathematics', code: 'MA3301', sem: 3, yr: 2023, type: 'semester', name: 'MA3301-Nov2023-Semester.pdf' },
    { sub: 'Digital Principles', code: 'EC3301', sem: 3, yr: 2024, type: 'semester', name: 'EC3301-Nov2024-Semester.pdf' },
    { sub: 'Machine Learning Foundations', code: 'AI3301', sem: 3, yr: 2024, type: 'semester', name: 'AI3301-Nov2024-Semester.pdf' },
    { sub: 'Object-Oriented Software Eng.', code: 'CS3306', sem: 3, yr: 2024, type: 'semester', name: 'CS3306-Nov2024-Semester.pdf' },
    { sub: 'Professional Ethics', code: 'HS3301', sem: 3, yr: 2024, type: 'semester', name: 'HS3301-Nov2024-Semester.pdf' },
    { sub: 'Data Structures & Algorithms', code: 'CS3301', sem: 3, yr: 2022, type: 'semester', name: 'CS3301-Nov2022-Semester.pdf' },
  ];

  for (const qp of qpList) {
    await QuestionPaper.create({
      department: 'CSE',
      subject: qp.sub,
      subjectCode: qp.code,
      semester: qp.sem,
      year: qp.yr,
      academicYear: `${qp.yr}-${qp.yr + 1}`,
      examType: qp.type,
      fileUrl: qp.name === 'CS3301-Nov2024-Semester.pdf'
        ? '/uploads/campushub-demo-cs3301-2024.pdf'
        : `/uploads/${qp.name}`,
      fileName: qp.name,
      fileSize: 450000 + (Math.random() * 200000),
      uploadedBy: admin._id,
      downloadCount: Math.floor(Math.random() * 80),
      isActive: true,
    });
  }
  console.log(`✓ Seeded ${qpList.length} previous Question Papers.`);

  // =========================================================================
  // 14b. DEMO COMMUNITY CONTENT
  // =========================================================================
  console.log('\n--- Seeding demo Lost & Found posts and notifications ---');
  const demoStudent = await Student.findOne({ userId: demoS1._id });
  if (demoStudent) {
    const existingPosts = await LostAndFound.countDocuments({ postedBy: demoStudent._id });
    if (existingPosts === 0) {
      await LostAndFound.insertMany([
        { type: 'lost', itemName: 'Black wallet', description: 'Black leather wallet with a college ID and two bank cards.', location: 'Central Library, second floor', date: new Date(Date.now() - 2 * 86400000), postedBy: demoStudent._id, contactMethod: 'CampusHub messages', status: 'active' },
        { type: 'found', itemName: 'Student ID card', description: 'ID card belonging to a CSE student, found near the main auditorium.', location: 'Main Auditorium entrance', date: new Date(Date.now() - 86400000), postedBy: demoStudent._id, contactMethod: 'Security desk at the main gate', status: 'active' },
        { type: 'found', itemName: 'USB drive', description: 'Small blue 32GB USB drive found after the afternoon lab session.', location: 'Block B computer lab', date: new Date(), postedBy: demoStudent._id, contactMethod: 'CSE department office', status: 'active' },
      ]);
    }

    const existingNotifications = await Notification.countDocuments({ userId: demoS1._id });
    if (existingNotifications === 0) {
      await Notification.insertMany([
        { userId: demoS1._id, type: 'important', title: 'Mid-term timetable published', body: 'The mid-term examination timetable is now available in the Exams section.', link: '/student/exams' },
        { userId: demoS1._id, type: 'info', title: 'Hackathon registration is open', body: 'Register for the Smart Campus Hackathon before the deadline.', link: '/student/events' },
      ]);
    }
  }
  console.log('✓ Demo community content verified.');

  // =========================================================================
  // 15. 25+ AI KNOWLEDGE BASE ENTRIES
  // =========================================================================
  console.log('\n--- 15. Seeding 25+ AI Knowledge Base Entries ---');
  await AIKnowledgeBase.deleteMany({});
  const aiEntries = [
    {
      category: 'academics',
      question: 'What is the minimum attendance required to appear for semester examinations?',
      answer: 'Students are required to maintain a minimum of 80% aggregate attendance across each subject. Students falling between 75% and 79% may be allowed only with valid medical proof upon paying condonation fees. Attendance below 75% results in being detained.',
      keywords: ['attendance', 'percentage', 'minimum', 'condonation', 'detained', 'eligibility'],
    },
    {
      category: 'procedures',
      question: 'How do I apply for On-Duty (OD) for hackathons and inter-college symposiums?',
      answer: 'Apply through the CampusHub Leave/OD tab at least 24 hours in advance. Upload the event invitation letter or registration acceptance proof. Your assigned faculty mentor will review and approve the OD, after which attendance is automatically credited.',
      keywords: ['od', 'on duty', 'hackathon', 'symposium', 'leave', 'apply'],
    },
    {
      category: 'procedures',
      question: 'What are the valid reasons for medical leave and what proof is required?',
      answer: 'Medical leave can be claimed for illness exceeding 2 days. A medical certificate from a registered physician or the campus health center must be uploaded during submission and submitted to the mentor within 3 days of resuming classes.',
      keywords: ['medical', 'doctor', 'hospital', 'certificate', 'sick'],
    },
    {
      category: 'office',
      question: 'What is the schedule and penalty policy for semester college fees payment?',
      answer: 'Semester fees must be paid online via the CampusHub portal before the announced due date. Late payment incurs a penalty of Rs. 100 per day up to 15 days, after which hall tickets are withheld until clearance.',
      keywords: ['fees', 'tuition', 'penalty', 'late', 'payment', 'due date'],
    },
    {
      category: 'office',
      question: 'Can college fees be paid in installments?',
      answer: 'Yes, students requiring financial accommodations can apply for installment plans by submitting a formal parent undertaking letter at the Accounts Office in the Central Administration Block.',
      keywords: ['installment', 'partial', 'split', 'payment plan', 'accounts'],
    },
    {
      category: 'transport',
      question: 'What are the college bus routes, timings, and stops?',
      answer: 'The college operates 10 bus routes covering Salem Junction, Attur, Omalur, Namakkal, Rasipuram, Sankari, Mettur Dam, Dharmapuri, Edappadi, and Tiruchengode. Buses arrive at campus by 8:35 AM and depart at 4:45 PM.',
      keywords: ['bus', 'routes', 'transport', 'timings', 'pickup', 'stops'],
    },
    {
      category: 'transport',
      question: 'How can I track my college bus location in real time?',
      answer: 'Day scholar students can navigate to the Transport section in CampusHub to view the driver status and live GPS location while the trip is marked active.',
      keywords: ['track', 'bus location', 'gps', 'driver', 'live tracking'],
    },
    {
      category: 'hostel',
      question: 'What are the hostel in-time and curfew rules?',
      answer: 'All hostel residents must report inside their respective hostel blocks (Kaveri, Bhavani, Ganga) by 8:30 PM. Attendance is recorded via biometric scanners at 8:45 PM.',
      keywords: ['hostel', 'curfew', 'timing', 'in time', 'biometric', 'entry'],
    },
    {
      category: 'hostel',
      question: 'What is the procedure for obtaining an overnight out-pass from the hostel?',
      answer: 'Overnight and weekend out-passes must be applied through CampusHub at least 12 hours in advance with parent phone verification. Approval from both the faculty mentor and hostel warden is required.',
      keywords: ['outpass', 'hostel outpass', 'weekend', 'home', 'night out'],
    },
    {
      category: 'hostel',
      question: 'What are the mess timings for breakfast, lunch, and dinner?',
      answer: 'Breakfast: 07:15 AM - 08:30 AM. Lunch: 12:20 PM - 01:15 PM. Evening Snacks: 04:45 PM - 05:30 PM. Dinner: 07:30 PM - 08:45 PM.',
      keywords: ['mess', 'food', 'breakfast', 'lunch', 'dinner', 'dining'],
    },
    {
      category: 'library',
      question: 'What are the working hours of the Dr. APJ Abdul Kalam Central Library?',
      answer: 'The Central Library is open from 8:00 AM to 8:00 PM on all weekdays, and 9:00 AM to 6:00 PM on Saturdays. During mid-term and semester examinations, reading halls remain open until 10:00 PM.',
      keywords: ['library', 'hours', 'timing', 'open', 'close', 'weekends'],
    },
    {
      category: 'library',
      question: 'How many books can an undergraduate student borrow and for how long?',
      answer: 'Undergraduate students can borrow up to 4 books simultaneously for an initial period of 14 days. Renewals can be done twice online if no hold exists.',
      keywords: ['borrow', 'books', 'borrowing', 'limit', 'renewal', 'return'],
    },
    {
      category: 'academics',
      question: 'What is the grading system and CGPA calculation scale?',
      answer: 'CampusHub uses a 10-point grading scale: O (91-100, 10 pts), A+ (81-90, 9 pts), A (71-80, 8 pts), B+ (61-70, 7 pts), B (50-60, 6 pts), RA (Reappear, 0 pts). Minimum pass mark is 50% in internal and external combined.',
      keywords: ['cgpa', 'gpa', 'grade', 'marks', 'grading', 'pass mark'],
    },
    {
      category: 'academics',
      question: 'How do I download previous semester question papers?',
      answer: 'Go to the Question Papers section on CampusHub, select your department (CSE/ECE/IT), year, and semester to view or download previous year question papers in PDF format.',
      keywords: ['question paper', 'previous paper', 'exam papers', 'pyq', 'download'],
    },
    {
      category: 'facilities',
      question: 'How do I report a maintenance issue or campus grievance?',
      answer: 'Navigate to the Complaints section in CampusHub. Choose the relevant category (Hostel, Transport, Electrical, Lab, Infrastructure), attach photo proof, and submit. An automated ticket ID will be generated.',
      keywords: ['complaint', 'grievance', 'ticket', 'report', 'issue', 'repair'],
    },
    {
      category: 'facilities',
      question: 'How do I connect to campus high-speed Wi-Fi?',
      answer: 'Select "CampusHub-Student-5G" SSID. Log in using your student institutional email address and your CampusHub portal password.',
      keywords: ['wifi', 'internet', 'network', 'login', 'ssid'],
    },
    {
      category: 'events',
      question: 'How can students join technical or cultural clubs?',
      answer: 'Visit the Clubs tab in CampusHub, browse the active societies (GDSC, Robotics, ACM, Raaga, Rotaract), and click "Join Club". The club student coordinator and faculty lead will review your request.',
      keywords: ['clubs', 'gdsc', 'robotics', 'join club', 'society', 'activities'],
    },
    {
      category: 'procedures',
      question: 'What are the eligibility criteria for campus placement drives?',
      answer: 'Students must possess a minimum CGPA of 6.5 (or higher for Tier-1 companies) with no standing arrears at the end of Semester 6, and a minimum 80% attendance in placement training classes.',
      keywords: ['placements', 'jobs', 'internship', 'eligibility', 'career', 'tcs'],
    },
    {
      category: 'facilities',
      question: 'Where is the campus health center and what are its emergency hours?',
      answer: 'The Campus Health Center is located on the Ground Floor of Central Administration Block (adjacent to Kaveri Hostel). Medical staff and an on-call ambulance are available 24/7. Emergency contact: +91 98400 11222.',
      keywords: ['health', 'doctor', 'clinic', 'hospital', 'ambulance', 'emergency'],
    },
    {
      category: 'office',
      question: 'What should I do if I lose my College ID Card?',
      answer: 'Report the loss to the Security Office and file a request for a duplicate ID card at the Administrative Block with a processing fee of Rs. 200. A temporary digital ID is visible in your CampusHub Profile.',
      keywords: ['id card', 'lost', 'duplicate', 'identity', 'badge'],
    },
    {
      category: 'facilities',
      question: 'What sports facilities are available and what are the ground timings?',
      answer: 'Campus facilities include floodlit cricket and football grounds, 2 basketball courts, 4 badminton courts, a volleyball court, and a modern gymnasium open from 5:30 AM - 7:30 AM and 4:30 PM - 7:00 PM.',
      keywords: ['sports', 'gym', 'ground', 'cricket', 'football', 'badminton'],
    },
    {
      category: 'academics',
      question: 'Who is my assigned faculty mentor and how can I reach them?',
      answer: 'Your faculty mentor is listed on your Profile and Dashboard. You can meet your mentor during official mentoring hours (Wednesday 3:45 PM - 4:30 PM) or communicate via phone/email listed on your profile.',
      keywords: ['mentor', 'advisor', 'counselor', 'faculty mentor', 'meeting'],
    },
    {
      category: 'general',
      question: 'What is the college anti-ragging policy and helpline number?',
      answer: 'CampusHub Engineering College has a zero-tolerance policy towards ragging. Violators face immediate suspension and legal prosecution under the UGC Anti-Ragging Act. Toll-free 24/7 Helpline: 1800-180-5522 or +91 94440 00000.',
      keywords: ['ragging', 'anti-ragging', 'safety', 'harassment', 'helpline'],
    },
    {
      category: 'facilities',
      question: 'What are the campus cafeteria and food court timings?',
      answer: 'The Student Activity Center Cafeteria is open from 7:30 AM to 8:30 PM offering vegetarian, non-vegetarian, healthy juices, and South/North Indian cuisines at subsidized rates.',
      keywords: ['canteen', 'cafeteria', 'food court', 'snacks', 'lunch'],
    },
    {
      category: 'procedures',
      question: 'What is the policy for semester internships and industrial training?',
      answer: 'Pre-final and final year students are eligible for summer/winter internships. A formal No Objection Certificate (NOC) must be obtained from the Head of Department through CampusHub.',
      keywords: ['internship', 'industrial training', 'noc', 'industry', 'summer'],
    },
  ];

  for (const entry of aiEntries) {
    await AIKnowledgeBase.create({
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      keywords: entry.keywords,
      isActive: true,
      lastUpdatedBy: admin._id,
    });
  }
  console.log(`✓ Seeded ${aiEntries.length} verified AI Knowledge Base entries.`);

  console.log('\n============================================================');
  console.log('🎉 COMPREHENSIVE CAMPUSHUB MONGODB SEEDING COMPLETED!');
  console.log('============================================================');
  console.log('Credentials Summary:');
  console.log('  Admin:       admin@campushub.edu       / Password@123  (or admin@demo.com)');
  console.log('  Faculty:     faculty@campushub.edu     / Password@123  (or faculty@demo.com)');
  console.log('  Mentor:      mentor@campushub.edu      / Password@123  (or mentor@demo.com)');
  console.log('  Student 1:   student@campushub.edu     / Password@123  (21CS001, Hosteller)');
  console.log('  Student 2:   sneha.reddy@campushub.edu / Password@123  (21CS002, Day Scholar - BUS-01)');
  console.log('  Driver:      driver@campushub.edu      / Password@123  (Assigned to BUS-01)');
  console.log('  Maintenance: maintenance@campushub.edu / Password@123');
  console.log('============================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
