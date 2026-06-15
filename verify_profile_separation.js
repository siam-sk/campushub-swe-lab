async function run() {
  try {
    const postData = {
      phone: '+8801712345678',
      bio: 'Administrator for CampusHub System.',
      skills: ['Management', 'Administration', 'Systems Integration']
    };

    console.log("Sending POST update request...");
    const postResponse = await fetch('http://localhost:5000/api/profile', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-admin@campushub.edu',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
    console.log("POST Response Status:", postResponse.status);
    const postPayload = await postResponse.json();
    console.log("POST Response JSON:");
    console.log(JSON.stringify(postPayload, null, 2));

    console.log("\nRe-fetching GET profile to verify persistence...");
    const getResponse = await fetch('http://localhost:5000/api/profile', {
      headers: {
        'Authorization': 'Bearer mock-admin@campushub.edu'
      }
    });
    console.log("GET Response Status:", getResponse.status);
    const getPayload = await getResponse.json();
    console.log("GET Response JSON:");
    console.log(JSON.stringify(getPayload, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error making requests:", error);
    process.exit(1);
  }
}

run();
