import Pocketbase from "pocketbase";
export const dbUrl = `https://oct2025-team5.pockethost.io/`; // Replace with your database URL
const pb = new Pocketbase(dbUrl);
export default pb;
