const token = 'vcp_7lKqDGB3pIuUYc6i7yX35yOLwsf0snXV4APwWor3oDfJwJ3UtV3oUWKa';
const teamId = 'team_RztnmMec6Wu6dyhIi2HjrHT7';
const deploymentId = 'dpl_J5aA5BkLwfJQcFDJeYuCJkKfX3YV';

async function run() {
  const url = `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${teamId}`;
  console.log(`Getting deployment status via Vercel REST API: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Deployment State:", data.readyState || data.status);
    if (data.error) {
      console.log("Error Details:", JSON.stringify(data.error, null, 2));
    } else {
      console.log("Full Data:", JSON.stringify({
        id: data.id,
        name: data.name,
        status: data.status,
        readyState: data.readyState,
        url: data.url,
        createdAt: data.createdAt,
        buildingAt: data.buildingAt,
        readyAt: data.readyAt,
        errorMessage: data.errorMessage
      }, null, 2));
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
