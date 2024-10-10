import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "https://date.nager.at/api/v3/AvailableCountries"
    );
    const countries = response.data;
    res.render("index.ejs", {
      countries: countries,
      holidaysData: null, //
      apiType: null,
      countryCode: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching countries");
  }
});

app.post("/get-holidays", async (req, res) => {
  const { apiType, countryCode, year } = req.body;

  let apiUrl = "";
  if (apiType === "PublicHolidays" && year) {
    apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  } else if (apiType === "IsTodayPublicHoliday") {
    apiUrl = `https://date.nager.at/api/v3/IsTodayPublicHoliday/${countryCode}`;
  } else if (apiType === "NextPublicHolidays") {
    apiUrl = `https://date.nager.at/api/v3/NextPublicHolidays/${countryCode}`;
  } else if (apiType === "NextPublicHolidaysWorldwide") {
    apiUrl = "https://date.nager.at/api/v3/NextPublicHolidaysWorldwide";
  }

  try {
    const result = await axios.get(apiUrl);
    const holidaysData = result.data;

    // 重新获取可用国家
    const countriesResponse = await axios.get(
      "https://date.nager.at/api/v3/AvailableCountries"
    );
    const countries = countriesResponse.data;
    let isPublicHoliday = null;
    if (apiType === "isTodayPublicHoliday") {
      const statusCode = result.status;
      isPublicHoliday = statusCode === 200; // 如果是200，则是公共假期
    }
    // 把数据传递到前端，判断如果有数据就显示
    res.render("index.ejs", {
      holidaysData,
      apiType,
      countries,
      countryCode,
      isPublicHoliday,
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);

    // 重新获取可用国家以在错误时保持界面可用
    const countriesResponse = await axios.get(
      "https://date.nager.at/api/v3/AvailableCountries"
    );
    const countries = countriesResponse.data;

    res.render("index.ejs", {
      holidaysData: null,
      apiType: null,

      error: "Error fetching data from API",
      countries,
    });
  }
});

app.listen(port, () => {
  console.log(`server is running on port ${port}.`);
});
