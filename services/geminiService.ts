import { GoogleGenAI, Type } from "@google/genai";
import type { Task, Priority, Status } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // A more user-friendly error could be shown in the UI
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

type ParsedTask = Partial<Pick<Task, 'title' | 'description' | 'priority' | 'dueDate'>>;

export const parseTaskFromNaturalLanguage = async (prompt: string): Promise<ParsedTask> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const systemInstruction = `You are an intelligent assistant for a task management app. Your role is to parse user input in Arabic and extract structured task information. Today's date is ${today}. When the user gives a relative date like "tomorrow" or "next Friday", you must convert it to the absolute YYYY-MM-DD format.`;
    const userPrompt = `Parse the following task description into a structured JSON object. The description is in Arabic.
- title: A concise title for the task.
- description: A detailed description.
- priority: The priority of the task, which must be one of "منخفض", "متوسط", or "عالي".
- dueDate: The due date in YYYY-MM-DD format. If no date is mentioned, this should be null.

Task Description: "${prompt}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "عنوان المهمة" },
            description: { type: Type.STRING, nullable: true, description: "وصف تفصيلي للمهمة" },
            priority: { type: Type.STRING, enum: ["منخفض", "متوسط", "عالي"], nullable: true, description: "أولوية المهمة" },
            dueDate: { type: Type.STRING, nullable: true, description: "تاريخ الاستحقاق بصيغة YYYY-MM-DD" },
          },
          required: ["title"],
        },
      },
    });
    
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Map Arabic priorities to the English enum keys if necessary, but our enum values are Arabic so direct mapping is fine.
    const result: ParsedTask = {};
    if (parsedJson.title) result.title = parsedJson.title;
    if (parsedJson.description) result.description = parsedJson.description;
    if (parsedJson.priority) result.priority = parsedJson.priority as Priority;
    if (parsedJson.dueDate) result.dueDate = parsedJson.dueDate;

    return result;

  } catch (error) {
    console.error("Error parsing task with Gemini:", error);
    throw new Error("فشل في تحليل المهمة باستخدام الذكاء الاصطناعي.");
  }
};


export const generateSubTasks = async (taskTitle: string, taskDescription?: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following task title and description, generate a list of actionable sub-tasks in Arabic. Title: "${taskTitle}". Description: "${taskDescription || 'No description'}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subTasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "مهمة فرعية واحدة قابلة للتنفيذ"
                            }
                        }
                    },
                    required: ['subTasks'],
                }
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        return parsedJson.subTasks || [];

    } catch (error) {
        console.error("Error generating sub-tasks with Gemini:", error);
        throw new Error("فشل في إنشاء مهام فرعية باستخدام الذكاء الاصطناعي.");
    }
};

export const filterTasksWithAI = async (query: string, tasks: Task[]): Promise<string[]> => {
    if (tasks.length === 0) {
        return [];
    }
    try {
        const today = new Date().toISOString().split('T')[0];
        const systemInstruction = `You are an intelligent search assistant for a task management app. Your role is to analyze a user's search query in Arabic and a list of tasks, then return the IDs of the tasks that match the query. Today's date is ${today}. Interpret relative dates like "tomorrow" or "next week" based on this date.`;
        
        // Minimize the data sent to the API
        const tasksForPrompt = tasks.map(({ id, title, description, priority, status, dueDate }) => ({ id, title, description, priority, status, dueDate }));

        const userPrompt = `User Query: "${query}"\n\nTasks JSON: ${JSON.stringify(tasksForPrompt)}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        matchingTaskIds: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "The ID of a task that matches the query.",
                            },
                        },
                    },
                    required: ["matchingTaskIds"],
                },
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        return parsedJson.matchingTaskIds || [];

    } catch (error) {
        console.error("Error filtering tasks with Gemini:", error);
        throw new Error("فشل في البحث عن المهام باستخدام الذكاء الاصطناعي.");
    }
};

export const generateDailyBriefing = async (tasks: Task[]): Promise<string> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const systemInstruction = `You are a helpful and motivating productivity assistant for a task management app. Your goal is to provide a clear, concise, and encouraging daily briefing for the user based on their task list. Your response must be in Arabic. Today's date is ${today}.`;

        const userPrompt = `Here is a list of my most important tasks. Please provide a brief summary to help me start my day.
- Highlight any overdue tasks first.
- Mention tasks due today.
- Mention any high-priority tasks.
- Keep the tone positive and encouraging.
- Format the response with clear headings (e.g., **المهام المتأخرة**) and bullet points.

Tasks:
${JSON.stringify(tasks, null, 2)}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        return response.text;

    } catch (error) {
        console.error("Error generating daily briefing with Gemini:", error);
        throw new Error("فشل في إنشاء الملخص اليومي باستخدام الذكاء الاصطناعي.");
    }
};
