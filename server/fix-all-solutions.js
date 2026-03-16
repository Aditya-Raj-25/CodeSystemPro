/**
 * ONE-TIME SCRIPT: Updates all 18 submissions in the database with their actual source code,
 * then re-pushes each one to GitHub so the real code appears in the repo.
 *
 * Usage: node fix-all-solutions.js
 */
const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const User = require('./models/User');
const { pushToGitHub } = require('./services/github');
const axios = require('axios');
require('dotenv').config();

// ============================
// SOLUTIONS EXTRACTED FROM BROWSER
// ============================
const KNOWN_SOLUTIONS = {
    // Binary Tree Preorder Traversal
    '1635711682': {
        code: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def preorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        if not root:
            return []
        return [root.val]+self.preorderTraversal(root.left)+self.preorderTraversal(root.right)`
    },
    // Binary Tree Inorder Traversal
    '1635721578': {
        code: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def inorderTraversal(self, root: Optional[TreeNode]) -> List[int]:
        if not root:
            return []
        return self.inorderTraversal(root.left)+[root.val]+self.inorderTraversal(root.right)`
    },
    // Complement of Base 10 Integer
    '1944951275': {
        code: `class Solution:
    def bitwiseComplement(self, n: int) -> int:
        if n == 0:
            return 1
        mask = 1
        while mask <= n:
            mask <<= 1
        return (mask - 1) ^ n`
    },
    // Candy
    '1945070773': {
        code: `class Solution:
    def candy(self, ratings: List[int]) -> int:
        n = len(ratings)
        candies = [1]*n
        for i in range(1,n):
            if ratings[i]>ratings[i-1]:
                candies[i]=candies[i-1]+1
        for i in range(n-2,-1,-1):
            if ratings[i]>ratings[i+1]:
                candies[i]=max(candies[i],candies[i+1]+1)
        return sum(candies)`
    },
    // Two Sum
    '1945427055': {
        code: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        n = len(nums)
        for i in range(n - 1):
            for j in range(i + 1, n):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []`
    },
    // Valid Parentheses
    '1948276388': {
        code: `class Solution:
    def isValid(self, s: str) -> bool:
        map = {")": "(", "}": "{", "]": "["}
        stack = []
        for char in s:
            if char in map:
                top_element = stack.pop() if stack else '#'
                if map[char] != top_element: return False
            else: stack.append(char)
        return not stack`
    },
    // Remove Element
    '1948331646': {
        code: `class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        k = 0
        for i in range(len(nums)):
            if nums[i] != val:
                nums[k] = nums[i]
                k += 1
        return k`
    },
    '1948383617': {
        code: `class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        k = 0
        for i in range(len(nums)):
            if nums[i] != val:
                nums[k] = nums[i]
                k += 1
        return k`
    },
    // Remove Duplicates from Sorted Array
    '1948325979': {
        code: `class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        if not nums: return 0
        k = 1
        for i in range(1, len(nums)):
            if nums[i] != nums[i-1]:
                nums[k] = nums[i]
                k += 1
        return k`
    },
    '1948327850': {
        code: `class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        if not nums: return 0
        k = 1
        for i in range(1, len(nums)):
            if nums[i] != nums[i-1]:
                nums[k] = nums[i]
                k += 1
        return k`
    },
    '1948331233': {
        code: `class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        if not nums: return 0
        k = 1
        for i in range(1, len(nums)):
            if nums[i] != nums[i-1]:
                nums[k] = nums[i]
                k += 1
        return k`
    },
    // Find the Index of the First Occurrence in a String
    '1948396083': {
        code: `class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        return haystack.find(needle)`
    },
    '1948415582': {
        code: `class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        return haystack.find(needle)`
    },
    // Search Insert Position
    '1949725624': {
        code: `class Solution:
    def searchInsert(self, nums: List[int], target: int) -> int:
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return left`
    },
    // Length of Last Word
    '1949726721': {
        code: `class Solution:
    def lengthOfLastWord(self, s: str) -> int:
        return len(s.strip().split()[-1])`
    }
};

// ============================
// FETCH CODE VIA LEETCODE GRAPHQL API
// ============================
async function fetchLeetCodeCode(submissionId) {
    try {
        const query = `query submissionDetails($submissionId: Int!) {
            submissionDetails(submissionId: $submissionId) {
                code
                lang { name }
                statusDisplay
                question { title titleSlug }
            }
        }`;
        const res = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { submissionId: parseInt(submissionId) }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        if (res.data?.data?.submissionDetails?.code) {
            return res.data.data.submissionDetails.code;
        }
    } catch (err) {
        console.log(`  [LeetCode API] Could not fetch code for ${submissionId}: ${err.message}`);
    }
    return null;
}

// ============================
// MAIN
// ============================
async function main() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codetrackr';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all submissions that are missing code
    const allSubs = await Submission.find({
        $or: [
            { code: '' },
            { code: null },
            { code: /not captured/ },
            { code: 'EMPTY' }
        ]
    });

    console.log(`Found ${allSubs.length} submissions missing code.\n`);

    let fixed = 0;
    let failed = 0;

    for (const sub of allSubs) {
        console.log(`Processing: ${sub.problemName} (${sub.platform}, ID: ${sub.submissionId})`);

        let code = null;

        // 1. Check if we have it in our known solutions
        if (KNOWN_SOLUTIONS[sub.submissionId]) {
            code = KNOWN_SOLUTIONS[sub.submissionId].code;
            console.log(`  ✅ Found in pre-extracted solutions`);
        }

        // 2. If not found, try LeetCode GraphQL API
        if (!code && sub.platform === 'leetcode') {
            console.log(`  Trying LeetCode GraphQL API...`);
            code = await fetchLeetCodeCode(sub.submissionId);
            if (code) {
                console.log(`  ✅ Fetched from LeetCode API`);
            }
        }

        // 3. If we got code, update DB and push to GitHub
        if (code) {
            sub.code = code;
            await sub.save();
            console.log(`  📦 Saved to database`);

            try {
                await pushToGitHub(sub.userId, sub);
                console.log(`  🚀 Pushed to GitHub`);
                fixed++;
            } catch (err) {
                console.log(`  ❌ GitHub push failed: ${err.message}`);
            }
        } else {
            console.log(`  ❌ Could not find code`);
            failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n--- DONE ---`);
    console.log(`Fixed: ${fixed}, Failed: ${failed}`);

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
