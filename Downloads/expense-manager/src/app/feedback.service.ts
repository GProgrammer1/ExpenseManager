import { Injectable } from '@angular/core';
import { firestore } from 'firebase.config';
import { collection, getDocs, where } from 'firebase/firestore';
import { OpenAI } from 'openai';
import { Expense } from './models';
import { query } from 'firebase/firestore';
@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  OPENAI_API_KEY = "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";
  openai!: OpenAI;
  constructor() {
    this.openai = new OpenAI({apiKey: this.OPENAI_API_KEY, dangerouslyAllowBrowser: true});
   }

   private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getExpenseFeedback(userId: string) {
    try {
      // Get user's expenses from Firestore
      const expensesRef = collection(firestore, `expenses`);
      const q = query(expensesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return "No expense data available.";
      }

      let expenseData: Expense[] = [];
      snapshot.forEach((doc) => {
        expenseData.push(doc.data() as Expense);
      });

      // Prepare a prompt for OpenAI
      const prompt = `
      Analyze the following expense data and provide feedback:
      ${JSON.stringify(expenseData)}

      - Categorize spending.
      - Identify unusual spending patterns.
      - Give budgeting advice.
      `;

      let retries = 3;
      let delayTime = 1000; // Start with 1 second

      while (retries > 0) {
        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          });

          return response.choices[0].message.content;
        } catch (error: any) {
          if (error.status === 429 && retries > 0) {
            console.warn(`Rate limit hit. Retrying in ${delayTime / 1000} seconds...`);
            await this.delay(delayTime);
            delayTime *= 2; // Exponential backoff (1s, 2s, 4s)
            retries--;
          } else {
            throw error;
          }
        }
      }

      return "Failed to generate AI feedback after multiple attempts.";
    } catch (error) {
      console.error("Error getting expense feedback:", error);
      return "Failed to generate AI feedback.";
    }
  }
  //gpt-4o-mini-audio-preview-2024-12-17
 // 
}
