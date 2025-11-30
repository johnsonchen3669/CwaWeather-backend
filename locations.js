/**
 * 台灣地點對應表
 * 將英文代碼映射到中文地點名稱
 */
const locations = {
  // 北部
  taipei: "台北市",
  newtaipei: "新北市",
  taoyuan: "桃園市",
  hsinchu: "新竹市",
  hsinchucounty: "新竹縣",
  miaoli: "苗栗縣",

  // 中部
  taichung: "台中市",
  nantou: "南投縣",
  changhua: "彰化縣",
  yunlin: "雲林縣",

  // 南部
  chiayi: "嘉義市",
  chiayi_county: "嘉義縣",
  tainan: "台南市",
  kaohsiung: "高雄市",
  pingtung: "屏東縣",

  // 東部
  yilan: "宜蘭縣",
  taitung: "台東縣",
  hualien: "花蓮縣",

  // 離島
  penghu: "澎湖縣",
  kinmen: "金門縣",
  lienchiang: "連江縣",
};

/**
 * 將英文代碼轉換為中文地點名稱
 * @param {string} code - 英文代碼（如 'taipei', 'kaohsiung'）
 * @returns {string|null} 中文地點名稱，若不存在則回傳 null
 */
const getLocationName = (code) => {
  if (!code) return null;

  const normalizedCode = code.toLowerCase().trim();
  return locations[normalizedCode] || null;
};

/**
 * 驗證地點代碼是否有效
 * @param {string} code - 要驗證的地點代碼
 * @returns {boolean} 是否為有效的地點代碼
 */
const isValidLocation = (code) => {
  return getLocationName(code) !== null;
};

/**
 * 取得所有可用的地點代碼
 * @returns {Array} 所有地點代碼的陣列
 */
const getAllLocationCodes = () => {
  return Object.keys(locations);
};

/**
 * 取得所有地點映射
 * @returns {Object} 完整的地點映射物件
 */
const getAllLocations = () => {
  return { ...locations };
};

module.exports = {
  locations,
  getLocationName,
  isValidLocation,
  getAllLocationCodes,
  getAllLocations,
};
