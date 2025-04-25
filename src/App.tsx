import './App.css';
import { World } from "./components/ui/globe";

// 生成不同深浅蓝色
const generateBlueColor = () => {
  const blueIntensity = Math.floor(Math.random() * 150) + 50;  // 随机生成蓝色的强度，控制在50到200之间
  return `rgb(0, 0, ${blueIntensity})`;  // 返回不同深浅的蓝色
};

const generateData = (count: number) => {  // 为 count 参数指定类型 number
  const data = [];
  for (let i = 1; i <= count; i++) {
    data.push({
      order: i,
      startLat: parseFloat((Math.random() * 180 - 90).toFixed(4)),  // 随机生成纬度
      startLng: parseFloat((Math.random() * 360 - 180).toFixed(4)),  // 随机生成经度
      endLat: parseFloat((Math.random() * 180 - 90).toFixed(4)),  // 随机生成目标纬度
      endLng: parseFloat((Math.random() * 360 - 180).toFixed(4)),  // 随机生成目标经度
      arcAlt: parseFloat((Math.random() * 0.5).toFixed(2)),  // 随机生成弧线高度
      color: generateBlueColor(),  // 使用深浅蓝色生成函数
    });
  }
  return data;
};

// 模拟20组数据
const data = generateData(20);

const config = {
  //globeTexture: '/textures/earth_texture.jpg',  // 高清地球纹理（确保路径正确）
  ambientLight: "#ffffff", // 环境光
  directionalLight: {
    color: "#ffffff",      // 日光色
    intensity: 1,        // 强度
    position: [0, 1, 0],   // 光源位置（太阳）
  },
  pointLight: "#ffffff",  // 点光源（如城市灯光）
  shadowEnabled: false,    // 启用阴影
  globeColor: "#000000",  // 深蓝色
  showAtmosphere: true,   // 显示大气层
  atmosphereColor: "#ffffff",  // 大气层颜色
  atmosphereAltitude: 0.1,     // 大气层高度
  atmosphereScattering: true,  // 开启散射效果
  arcTime: 4000,        // 飞行轨迹的时间
  arcLength: 0.8,       // 弧线的长度
  arcHeight: 0.5,       // 弧线的高度
  rings: 2,             // 环的数量
  maxRings: 3,          // 最大环数
  rotationSpeed: 0.02,   // 地球自转速度
  //dayNightCycle: true,   // 启用昼夜交替效果
  //skyboxTexture: '/textures/sky_texture.jpg',  // 星空背景
  //starsEnabled: true,    // 启用星空效果
  //cloudTexture: '/textures/cloud_texture.jpg', // 云层贴图
  //weatherEffects: 'dynamic',  // 动态天气
};

function App() {
  return (
    <div className="w-screen h-screen bg-black">
      {/* 这里是地球组件，传入配置信息和数据 */}
      <World globeConfig={config} data={data} />
      
      {/* 移除了与计数器和 HMR 提示相关的部分 */}
      <h1 className="text-white text-center mt-8">地球展</h1>
    </div>
  );
}

export default App;
