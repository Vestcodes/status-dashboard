async function run() {
  const res = await fetch("https://status.vestcodes.co/api/history?projectId=1e66c6de-7b6f-40e1-ac91-863a34a7428c"); // wait, I don't know the projectId
  // How to get projectId? Let's use the DB directly by extracting the service role key and using REST.
}
run();
