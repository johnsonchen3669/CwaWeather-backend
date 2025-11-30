require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const {
  getLocationName,
  isValidLocation,
  getAllLocations,
  getAllLocationCodes,
} = require("./locations");

const app = express();
const PORT = process.env.PORT || 3000;

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 取得天氣預報
 * CWA 氣象資料開放平臺 API
 * 使用「一般天氣預報-今明 36 小時天氣預報」資料集
 * @param {string} location - 地點名稱（如：高雄市、台北市、宜蘭縣等）
 */
const getWeather = async (location = "宜蘭縣") => {
  // 檢查是否有設定 API Key
  if (!CWA_API_KEY) {
    throw {
      status: 500,
      error: "伺服器設定錯誤",
      message: "請在 .env 檔案中設定 CWA_API_KEY",
    };
  }

  // 呼叫 CWA API - 一般天氣預報（36小時）
  // API 文件: https://opendata.cwa.gov.tw/dist/opendata-swagger.html
  const response = await axios.get(
    `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
    {
      params: {
        Authorization: CWA_API_KEY,
        locationName: location,
      },
    }
  );

  // 取得指定地點的天氣資料
  const locationData = response.data.records.location[0];

  if (!locationData) {
    throw {
      status: 404,
      error: "查無資料",
      message: `無法取得 ${location} 的天氣資料`,
    };
  }

  // 整理天氣資料
  const weatherData = {
    city: locationData.locationName,
    updateTime: response.data.records.datasetDescription,
    forecasts: [],
  };

  // 解析天氣要素
  const weatherElements = locationData.weatherElement;
  const timeCount = weatherElements[0].time.length;

  for (let i = 0; i < timeCount; i++) {
    const forecast = {
      startTime: weatherElements[0].time[i].startTime,
      endTime: weatherElements[0].time[i].endTime,
      weather: "",
      rain: "",
      minTemp: "",
      maxTemp: "",
      comfort: "",
      windSpeed: "",
    };

    weatherElements.forEach((element) => {
      const value = element.time[i].parameter;
      switch (element.elementName) {
        case "Wx":
          forecast.weather = value.parameterName;
          break;
        case "PoP":
          forecast.rain = value.parameterName + "%";
          break;
        case "MinT":
          forecast.minTemp = value.parameterName + "°C";
          break;
        case "MaxT":
          forecast.maxTemp = value.parameterName + "°C";
          break;
        case "CI":
          forecast.comfort = value.parameterName;
          break;
        case "WS":
          forecast.windSpeed = value.parameterName;
          break;
      }
    });

    weatherData.forecasts.push(forecast);
  }

  return weatherData;
};

/**
 * 路由處理器：通用天氣查詢
 */
const handleGetWeather = async (req, res) => {
  try {
    let location = req.params.location || "yilan";

    // 如果是英文代碼，轉換為中文地點名稱
    if (isValidLocation(location)) {
      location = getLocationName(location);
    }
    // 否則直接使用輸入的地點名稱（相容性）

    const weatherData = await getWeather(location);
    res.json({
      success: true,
      data: weatherData,
    });
  } catch (error) {
    console.error("取得天氣資料失敗:", error.message);

    if (error.status) {
      // 自定義錯誤
      return res.status(error.status).json({
        error: error.error,
        message: error.message,
      });
    }

    if (error.response) {
      // API 回應錯誤
      return res.status(error.response.status).json({
        error: "CWA API 錯誤",
        message: error.response.data.message || "無法取得天氣資料",
        details: error.response.data,
      });
    }

    // 其他錯誤
    res.status(500).json({
      error: "伺服器錯誤",
      message: "無法取得天氣資料，請稍後再試",
    });
  }
};

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "歡迎使用 CWA 天氣預報 API",
    endpoints: {
      health: "/api/health",
      locations: "/api/locations",
      weather_english: "/api/weather/:location (英文代碼)",
      weather_chinese: "/api/weather/:location (中文地點名稱)",
    },
    examples: {
      english_taipei: "/api/weather/taipei",
      english_kaohsiung: "/api/weather/kaohsiung",
      english_yilan: "/api/weather/yilan",
      chinese_taipei: "/api/weather/台北市",
      chinese_kaohsiung: "/api/weather/高雄市",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 取得所有可用的地點列表及對應代碼
app.get("/api/locations", (req, res) => {
  res.json({
    total: getAllLocationCodes().length,
    locations: getAllLocations(),
    codes: getAllLocationCodes(),
  });
});

// 取得高雄天氣預報（原有路由，保持向後兼容）
app.get("/api/weather/kaohsiung", async (req, res) => {
  req.params.location = "kaohsiung";
  handleGetWeather(req, res);
});

// 取得指定地點天氣預報（新增路由）
app.get("/api/weather/:location", handleGetWeather);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "伺服器錯誤",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "找不到此路徑",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 伺服器運行已運作`);
  console.log(`📍 環境: ${process.env.NODE_ENV || "development"}`);
});
