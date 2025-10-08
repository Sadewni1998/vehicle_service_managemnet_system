// Test Sri Lankan timezone date function

const getSriLankanDate = () => {
  const now = new Date();
  // Get date parts in Sri Lankan timezone
  const sriLankaDateString = now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }); // en-CA gives us YYYY-MM-DD format
  return sriLankaDateString;
};

console.log("🌍 Timezone Test\n");
console.log("─".repeat(60));

const now = new Date();
console.log("Current System Time:", now.toString());
console.log("UTC Time (ISO):", now.toISOString());
console.log("UTC Date:", now.toISOString().split("T")[0]);
console.log();

const sriLankaTimeString = now.toLocaleString("en-US", {
  timeZone: "Asia/Colombo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
console.log("Sri Lankan Time:", sriLankaTimeString);

const sriLankanDate = getSriLankanDate();
console.log("Sri Lankan Date:", sriLankanDate);

console.log("─".repeat(60));
console.log("\n✅ The backend will use:", sriLankanDate);
console.log("   This matches Sri Lankan local date (Asia/Colombo, UTC+5:30)\n");
