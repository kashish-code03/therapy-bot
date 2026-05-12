export const sendMessage = async (message, history) => {
  const response = await fetch("http://localhost/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) throw new Error("API request failed");
  return await response.json();
};