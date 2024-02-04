import axios from "axios";

const dummyApi = axios.create({
  baseURL: process.env.DUMMY_JSON_API,
});

export default dummyApi;
