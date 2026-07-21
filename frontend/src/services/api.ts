import axios from "axios";

const apiRPC = axios.create({
  baseURL: import.meta.env.VITE_API_RPC_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiRPC;
