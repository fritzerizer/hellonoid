export interface Manufacturer {
  id: number;
  name: string;
  slug: string;
  country: string;
  website: string;
  logo_url: string;
  founded_year: number;
  description: string;
}

export interface Robot {
  id: number;
  name: string;
  slug: string;
  manufacturer_id: number;
  status: 'announced' | 'development' | 'shipping' | 'discontinued';
  category: string;
  hero_image_url: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface RobotSpec {
  id: number;
  robot_id: number;
  spec_key: string;
  spec_value: string;
  spec_unit: string;
  spec_category: 'dimensions' | 'performance' | 'sensors' | 'battery' | 'actuators' | 'general';
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  robot_id: number | null;
  published_at: string;
  source_url: string;
  image_url: string;
}

export const manufacturers: Manufacturer[] = [
  { id: 1, name: 'Tesla', slug: 'tesla', country: 'USA', website: 'https://tesla.com', logo_url: '', founded_year: 2003, description: 'Electric vehicle and clean energy company developing the Optimus humanoid robot.' },
  { id: 2, name: '1X Technologies', slug: '1x-technologies', country: 'Norway', website: 'https://1x.tech', logo_url: '', founded_year: 2014, description: 'Norwegian robotics company backed by OpenAI, building androids for everyday tasks.' },
  { id: 3, name: 'Figure AI', slug: 'figure-ai', country: 'USA', website: 'https://figure.ai', logo_url: '', founded_year: 2022, description: 'AI robotics company developing general-purpose humanoid robots.' },
  { id: 4, name: 'Unitree Robotics', slug: 'unitree', country: 'China', website: 'https://unitree.com', logo_url: '', founded_year: 2016, description: 'Chinese robotics company known for affordable legged robots.' },
  { id: 5, name: 'Boston Dynamics', slug: 'boston-dynamics', country: 'USA', website: 'https://bostondynamics.com', logo_url: '', founded_year: 1992, description: 'Pioneer in dynamic robots, now owned by Hyundai. Famous for Spot and Atlas.' },
  { id: 6, name: 'Agility Robotics', slug: 'agility-robotics', country: 'USA', website: 'https://agilityrobotics.com', logo_url: '', founded_year: 2015, description: 'Creators of Digit, a multi-purpose humanoid robot designed for logistics.' },
  { id: 7, name: 'Apptronik', slug: 'apptronik', country: 'USA', website: 'https://apptronik.com', logo_url: '', founded_year: 2016, description: 'Austin-based robotics company building Apollo for industrial and commercial use.' },
  { id: 8, name: 'Sanctuary AI', slug: 'sanctuary-ai', country: 'Canada', website: 'https://sanctuary.ai', logo_url: '', founded_year: 2018, description: 'Canadian company building general-purpose robots with human-like intelligence.' },
  { id: 9, name: 'Xiaomi', slug: 'xiaomi', country: 'China', website: 'https://xiaomi.com', logo_url: '', founded_year: 2010, description: 'Chinese tech giant expanding into humanoid robotics with CyberOne.' },
];

export const robots: Robot[] = [
  { id: 1, name: 'Tesla Optimus (Gen 2)', slug: 'tesla-optimus-gen-2', manufacturer_id: 1, status: 'development', category: 'General Purpose', hero_image_url: '', summary: 'Tesla\'s second-generation humanoid robot featuring improved hands with 22 degrees of freedom and 30% faster walking speed.', created_at: '2024-01-01', updated_at: '2024-12-01' },
  { id: 2, name: '1X NEO', slug: '1x-neo', manufacturer_id: 2, status: 'development', category: 'Home Assistant', hero_image_url: '', summary: 'Lightweight android designed for home environments with an exceptionally long 20-hour battery life.', created_at: '2024-01-01', updated_at: '2024-08-01' },
  { id: 3, name: 'Figure 02', slug: 'figure-02', manufacturer_id: 3, status: 'development', category: 'General Purpose', hero_image_url: '', summary: 'Second-generation humanoid with integrated speech capabilities powered by OpenAI, designed for commercial deployment.', created_at: '2024-01-01', updated_at: '2024-08-01' },
  { id: 4, name: 'Unitree H1', slug: 'unitree-h1', manufacturer_id: 4, status: 'shipping', category: 'Research/Industrial', hero_image_url: '', summary: 'High-performance humanoid with record-breaking 9.4 m/s top speed, targeting research and industrial applications.', created_at: '2024-01-01', updated_at: '2024-06-01' },
  { id: 5, name: 'Unitree G1', slug: 'unitree-g1', manufacturer_id: 4, status: 'shipping', category: 'General Purpose', hero_image_url: '', summary: 'Affordable humanoid robot starting at $16,000, making humanoid robotics accessible to a wider market.', created_at: '2024-01-01', updated_at: '2024-06-01' },
  { id: 6, name: 'Boston Dynamics Atlas (Electric)', slug: 'boston-dynamics-atlas-electric', manufacturer_id: 5, status: 'development', category: 'Industrial', hero_image_url: '', summary: 'All-electric successor to the hydraulic Atlas, featuring multi-axis joints and unprecedented range of motion.', created_at: '2024-01-01', updated_at: '2024-10-01' },
  { id: 7, name: 'Agility Digit', slug: 'agility-digit', manufacturer_id: 6, status: 'shipping', category: 'Logistics', hero_image_url: '', summary: 'Purpose-built for warehouse logistics, Digit can lift and carry packages in human-designed spaces.', created_at: '2024-01-01', updated_at: '2024-09-01' },
  { id: 8, name: 'Apptronik Apollo', slug: 'apptronik-apollo', manufacturer_id: 7, status: 'development', category: 'Industrial', hero_image_url: '', summary: 'Industrial humanoid with 25kg payload capacity, designed for manufacturing and logistics environments.', created_at: '2024-01-01', updated_at: '2024-07-01' },
  { id: 9, name: 'Sanctuary AI Phoenix', slug: 'sanctuary-ai-phoenix', manufacturer_id: 8, status: 'development', category: 'General Purpose', hero_image_url: '', summary: 'General-purpose humanoid featuring industry-leading dexterous hands with 20+ degrees of freedom per hand.', created_at: '2024-01-01', updated_at: '2024-09-01' },
  { id: 10, name: 'Xiaomi CyberOne', slug: 'xiaomi-cyberone', manufacturer_id: 9, status: 'announced', category: 'Research', hero_image_url: '', summary: 'Xiaomi\'s humanoid robot prototype capable of emotion recognition and 3D space perception.', created_at: '2024-01-01', updated_at: '2024-03-01' },
];

export const robotSpecs: RobotSpec[] = [
  // Tesla Optimus Gen 2
  { id: 1, robot_id: 1, spec_key: 'Height', spec_value: '173', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 2, robot_id: 1, spec_key: 'Weight', spec_value: '56', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 3, robot_id: 1, spec_key: 'Walking Speed', spec_value: '8', spec_unit: 'km/h', spec_category: 'performance' },
  { id: 4, robot_id: 1, spec_key: 'Payload', spec_value: '9', spec_unit: 'kg', spec_category: 'performance' },
  { id: 5, robot_id: 1, spec_key: 'Hand DOF', spec_value: '22', spec_unit: 'DOF', spec_category: 'actuators' },
  { id: 6, robot_id: 1, spec_key: 'Total DOF', spec_value: '28', spec_unit: 'DOF', spec_category: 'actuators' },
  { id: 7, robot_id: 1, spec_key: 'Battery', spec_value: '2.3', spec_unit: 'kWh', spec_category: 'battery' },
  { id: 8, robot_id: 1, spec_key: 'Sensors', spec_value: 'Cameras, IMU, Force/Torque sensors', spec_unit: '', spec_category: 'sensors' },
  { id: 100, robot_id: 1, spec_key: 'Price', spec_value: '~20,000 (target)', spec_unit: 'USD', spec_category: 'general' },

  // 1X NEO
  { id: 9, robot_id: 2, spec_key: 'Height', spec_value: '167', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 10, robot_id: 2, spec_key: 'Weight', spec_value: '30', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 11, robot_id: 2, spec_key: 'Battery Life', spec_value: '2-4', spec_unit: 'hours (active)', spec_category: 'battery' },
  { id: 12, robot_id: 2, spec_key: 'Locomotion', spec_value: 'Bipedal', spec_unit: '', spec_category: 'performance' },
  { id: 13, robot_id: 2, spec_key: 'Actuators', spec_value: 'Proprietary biological-inspired', spec_unit: '', spec_category: 'actuators' },
  { id: 14, robot_id: 2, spec_key: 'Sensors', spec_value: 'Cameras, depth sensors', spec_unit: '', spec_category: 'sensors' },
  { id: 101, robot_id: 2, spec_key: 'AI', spec_value: 'Neural network end-to-end control', spec_unit: '', spec_category: 'general' },

  // Figure 02
  { id: 15, robot_id: 3, spec_key: 'Height', spec_value: '167', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 16, robot_id: 3, spec_key: 'Weight', spec_value: '70', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 17, robot_id: 3, spec_key: 'Payload', spec_value: '20', spec_unit: 'kg', spec_category: 'performance' },
  { id: 18, robot_id: 3, spec_key: 'Battery Life', spec_value: '5', spec_unit: 'hours', spec_category: 'battery' },
  { id: 19, robot_id: 3, spec_key: 'Hand DOF', spec_value: '16', spec_unit: 'DOF per hand', spec_category: 'actuators' },
  { id: 20, robot_id: 3, spec_key: 'Speech', spec_value: 'OpenAI-powered conversational AI', spec_unit: '', spec_category: 'sensors' },
  { id: 102, robot_id: 3, spec_key: 'Walking Speed', spec_value: '4.8', spec_unit: 'km/h', spec_category: 'performance' },

  // Unitree H1
  { id: 21, robot_id: 4, spec_key: 'Height', spec_value: '180', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 22, robot_id: 4, spec_key: 'Weight', spec_value: '47', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 23, robot_id: 4, spec_key: 'Top Speed', spec_value: '9.4', spec_unit: 'm/s', spec_category: 'performance' },
  { id: 24, robot_id: 4, spec_key: 'Total DOF', spec_value: '19', spec_unit: 'DOF', spec_category: 'actuators' },
  { id: 25, robot_id: 4, spec_key: 'Battery', spec_value: '864', spec_unit: 'Wh', spec_category: 'battery' },
  { id: 26, robot_id: 4, spec_key: 'Sensors', spec_value: '3D LiDAR, depth camera, IMU', spec_unit: '', spec_category: 'sensors' },
  { id: 103, robot_id: 4, spec_key: 'Price', spec_value: '90,000', spec_unit: 'USD', spec_category: 'general' },

  // Unitree G1
  { id: 27, robot_id: 5, spec_key: 'Height', spec_value: '127', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 28, robot_id: 5, spec_key: 'Weight', spec_value: '35', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 29, robot_id: 5, spec_key: 'Walking Speed', spec_value: '7.2', spec_unit: 'km/h', spec_category: 'performance' },
  { id: 30, robot_id: 5, spec_key: 'Total DOF', spec_value: '23-43', spec_unit: 'DOF (config dependent)', spec_category: 'actuators' },
  { id: 31, robot_id: 5, spec_key: 'Battery', spec_value: '~9', spec_unit: 'kWh', spec_category: 'battery' },
  { id: 32, robot_id: 5, spec_key: 'Sensors', spec_value: '3D LiDAR, depth camera, IMU', spec_unit: '', spec_category: 'sensors' },
  { id: 104, robot_id: 5, spec_key: 'Price', spec_value: '16,000', spec_unit: 'USD', spec_category: 'general' },

  // Boston Dynamics Atlas Electric
  { id: 33, robot_id: 6, spec_key: 'Height', spec_value: '152', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 34, robot_id: 6, spec_key: 'Weight', spec_value: '89', spec_unit: 'kg (est.)', spec_category: 'dimensions' },
  { id: 35, robot_id: 6, spec_key: 'Joints', spec_value: 'Multi-axis, 360° rotation capable', spec_unit: '', spec_category: 'actuators' },
  { id: 36, robot_id: 6, spec_key: 'Locomotion', spec_value: 'Bipedal, extreme range of motion', spec_unit: '', spec_category: 'performance' },
  { id: 37, robot_id: 6, spec_key: 'Sensors', spec_value: 'Multi-camera perception, depth sensors', spec_unit: '', spec_category: 'sensors' },
  { id: 38, robot_id: 6, spec_key: 'Power', spec_value: 'All-electric (battery)', spec_unit: '', spec_category: 'battery' },
  { id: 105, robot_id: 6, spec_key: 'Gripper', spec_value: 'Custom multi-finger end effector', spec_unit: '', spec_category: 'actuators' },

  // Agility Digit
  { id: 39, robot_id: 7, spec_key: 'Height', spec_value: '175', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 40, robot_id: 7, spec_key: 'Weight', spec_value: '65', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 41, robot_id: 7, spec_key: 'Payload', spec_value: '16', spec_unit: 'kg', spec_category: 'performance' },
  { id: 42, robot_id: 7, spec_key: 'Battery Life', spec_value: '2-4', spec_unit: 'hours', spec_category: 'battery' },
  { id: 43, robot_id: 7, spec_key: 'Use Case', spec_value: 'Warehouse logistics, package handling', spec_unit: '', spec_category: 'general' },
  { id: 44, robot_id: 7, spec_key: 'Sensors', spec_value: 'LiDAR, cameras, IMU', spec_unit: '', spec_category: 'sensors' },
  { id: 106, robot_id: 7, spec_key: 'Walking Speed', spec_value: '5.4', spec_unit: 'km/h', spec_category: 'performance' },

  // Apptronik Apollo
  { id: 45, robot_id: 8, spec_key: 'Height', spec_value: '173', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 46, robot_id: 8, spec_key: 'Weight', spec_value: '73', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 47, robot_id: 8, spec_key: 'Payload', spec_value: '25', spec_unit: 'kg', spec_category: 'performance' },
  { id: 48, robot_id: 8, spec_key: 'Battery Life', spec_value: '4', spec_unit: 'hours', spec_category: 'battery' },
  { id: 49, robot_id: 8, spec_key: 'Battery', spec_value: 'Swappable battery pack', spec_unit: '', spec_category: 'battery' },
  { id: 50, robot_id: 8, spec_key: 'Sensors', spec_value: 'Cameras, force/torque, IMU', spec_unit: '', spec_category: 'sensors' },
  { id: 107, robot_id: 8, spec_key: 'Walking Speed', spec_value: '4.8', spec_unit: 'km/h', spec_category: 'performance' },

  // Sanctuary AI Phoenix
  { id: 51, robot_id: 9, spec_key: 'Height', spec_value: '170', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 52, robot_id: 9, spec_key: 'Weight', spec_value: '70', spec_unit: 'kg (est.)', spec_category: 'dimensions' },
  { id: 53, robot_id: 9, spec_key: 'Hand DOF', spec_value: '20+', spec_unit: 'DOF per hand', spec_category: 'actuators' },
  { id: 54, robot_id: 9, spec_key: 'AI System', spec_value: 'Carbon (proprietary AGI system)', spec_unit: '', spec_category: 'general' },
  { id: 55, robot_id: 9, spec_key: 'Locomotion', spec_value: 'Bipedal (7th gen)', spec_unit: '', spec_category: 'performance' },
  { id: 56, robot_id: 9, spec_key: 'Sensors', spec_value: 'Cameras, tactile sensors in hands', spec_unit: '', spec_category: 'sensors' },
  { id: 108, robot_id: 9, spec_key: 'Use Case', spec_value: 'General-purpose labor, retail', spec_unit: '', spec_category: 'general' },

  // Xiaomi CyberOne
  { id: 57, robot_id: 10, spec_key: 'Height', spec_value: '177', spec_unit: 'cm', spec_category: 'dimensions' },
  { id: 58, robot_id: 10, spec_key: 'Weight', spec_value: '52', spec_unit: 'kg', spec_category: 'dimensions' },
  { id: 59, robot_id: 10, spec_key: 'Total DOF', spec_value: '21', spec_unit: 'DOF', spec_category: 'actuators' },
  { id: 60, robot_id: 10, spec_key: 'Walking Speed', spec_value: '3.6', spec_unit: 'km/h', spec_category: 'performance' },
  { id: 61, robot_id: 10, spec_key: 'Sensors', spec_value: 'Depth camera, emotion recognition AI', spec_unit: '', spec_category: 'sensors' },
  { id: 62, robot_id: 10, spec_key: 'Perception', spec_value: '3D space reconstruction, emotion detection', spec_unit: '', spec_category: 'sensors' },
  { id: 109, robot_id: 10, spec_key: 'Torque', spec_value: '300', spec_unit: 'Nm (peak)', spec_category: 'actuators' },
];

export const news: NewsArticle[] = [
  { id: 1, title: 'Tesla Optimus Gen 2 Demonstrates Improved Dexterity', slug: 'tesla-optimus-gen-2-dexterity', content: 'Tesla has released new footage of the Optimus Gen 2 humanoid robot demonstrating significantly improved hand dexterity, including the ability to handle eggs without breaking them. The robot features 22 degrees of freedom in its hands and walks 30% faster than the first generation.', robot_id: 1, published_at: '2024-12-15', source_url: 'https://tesla.com', image_url: '' },
  { id: 2, title: 'Figure 02 Deployed at BMW Manufacturing Plant', slug: 'figure-02-bmw-deployment', content: 'Figure AI has begun deploying its Figure 02 humanoid robots at BMW\'s Spartanburg manufacturing facility. The robots are performing tasks alongside human workers, marking one of the first commercial deployments of general-purpose humanoid robots in automotive manufacturing.', robot_id: 3, published_at: '2024-11-20', source_url: 'https://figure.ai', image_url: '' },
  { id: 3, title: 'Unitree G1 Breaks Price Barrier at $16,000', slug: 'unitree-g1-price-barrier', content: 'Unitree Robotics has announced the G1 humanoid robot at a starting price of $16,000, making it the most affordable humanoid robot on the market. The robot features up to 43 degrees of freedom and can perform backflips from a standing position.', robot_id: 5, published_at: '2024-10-05', source_url: 'https://unitree.com', image_url: '' },
  { id: 4, title: 'Boston Dynamics Unveils All-Electric Atlas', slug: 'boston-dynamics-electric-atlas', content: 'Boston Dynamics has retired its iconic hydraulic Atlas robot and revealed an all-electric successor. The new Atlas features a completely redesigned form factor with multi-axis joints that give it an unprecedented range of motion, including the ability to rotate joints 360 degrees.', robot_id: 6, published_at: '2024-09-18', source_url: 'https://bostondynamics.com', image_url: '' },
  { id: 5, title: 'Agility Robotics Opens RoboFab — World\'s First Humanoid Factory', slug: 'agility-robofab-humanoid-factory', content: 'Agility Robotics has opened RoboFab in Salem, Oregon — the world\'s first factory dedicated to manufacturing humanoid robots at scale. The facility aims to produce 10,000 Digit robots per year.', robot_id: 7, published_at: '2024-08-12', source_url: 'https://agilityrobotics.com', image_url: '' },
  { id: 6, title: '1X NEO Showcases Home Navigation Capabilities', slug: '1x-neo-home-navigation', content: '1X Technologies has released demonstrations of its NEO humanoid robot navigating home environments, performing tasks like tidying up rooms and interacting naturally with household objects. The lightweight 30kg robot is designed specifically for domestic use.', robot_id: 2, published_at: '2024-07-25', source_url: 'https://1x.tech', image_url: '' },
];

// Helper functions
export function getRobotWithDetails(slug: string) {
  const robot = robots.find(r => r.slug === slug);
  if (!robot) return null;
  const manufacturer = manufacturers.find(m => m.id === robot.manufacturer_id);
  const specs = robotSpecs.filter(s => s.robot_id === robot.id);
  return { robot, manufacturer: manufacturer!, specs };
}

export function getRobotsByManufacturer(manufacturerSlug: string) {
  const manufacturer = manufacturers.find(m => m.slug === manufacturerSlug);
  if (!manufacturer) return [];
  return robots.filter(r => r.manufacturer_id === manufacturer.id);
}

export function getSpecsByCategory(robotId: number) {
  const specs = robotSpecs.filter(s => s.robot_id === robotId);
  const grouped: Record<string, RobotSpec[]> = {};
  for (const spec of specs) {
    if (!grouped[spec.spec_category]) grouped[spec.spec_category] = [];
    grouped[spec.spec_category].push(spec);
  }
  return grouped;
}
