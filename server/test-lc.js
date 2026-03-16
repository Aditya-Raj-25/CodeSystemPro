const axios = require('axios');
async function test() {
    const submissionId = 1944926585;
    const detailQuery = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        question {
          difficulty
        }
      }
    }
  `;
    try {
        const response = await axios.post('https://leetcode.com/graphql', {
            query: detailQuery,
            variables: { submissionId }
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}
test();
