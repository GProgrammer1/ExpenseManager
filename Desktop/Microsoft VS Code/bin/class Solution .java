class Solution {
    public List<String> summaryRanges(int[] nums) {
        int i=0,j=1;
        int minInterval=nums[j]-nums[i];
        for( i=0;i<nums.length();i++){

        if((nums[j]-nums[i])<minInterval){
            minInterval=nums[j]-nums[i];
        }
    }
}
[3,10,14,17,20,23,26,30,33]
[3,10,14=>26,30=>33]