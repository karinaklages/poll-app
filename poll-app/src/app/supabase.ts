import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js'

interface Survey {
    id: string
    is_active: boolean
    title: string
    description: string
    end_date: string | null
    category: string
    created_at: string
    updated_at: string
}

interface Question {
    id: string
    survey_id: string | null
    question_text: string
    options: any | null
    sort_order: number
    allow_multiple: boolean
    created_at: string
}

interface Response {
    id: string
    survey_id: string | null
    question_id: string | null
    answer_value: string | null
    respondent_token: string | null
    submitted_at: string
}

@Injectable({
    providedIn: 'root',
})
export class Supabase {
    supabaseUrl = 'https://ogudjorvmctzuybwqtip.supabase.co'
    supabaseKey = 'sb_publishable_LhFI7nGSosl57l4BNRgY_Q_xWFNLcy3'
    supabase = createClient(this.supabaseUrl, this.supabaseKey)

    surveys = signal<Survey[]>([])
    questions = signal<Question[]>([])
    responses = signal<Response[]>([])

    /**
     * Fetches all surveys from the Supabase database and updates the surveys signal. This method is called on component initialization to load the available surveys. It uses the Supabase client to query the 'surveys' table and retrieves all records. If the query is successful, the retrieved surveys are stored in the surveys signal, which can then be used throughout the application to display survey data. If there is an error during the fetch, it is logged to the console.
     */
    async getSurveys() {
        let { data: surveys, error } = await this.supabase
            .from('surveys')
            .select('*')
        if (!surveys) return
        this.surveys.set(surveys)
    }

    /**
     * Fetches all questions for a given survey from the Supabase database and updates the questions signal. This method is called when a survey is selected to load its associated questions. It uses the Supabase client to query the 'questions' table, filtering by the provided survey ID. If the query is successful, the retrieved questions are stored in the questions signal, which can then be used to display the questions for the selected survey. If there is an error during the fetch, it is logged to the console.
     */
    async getQuestions(surveyId: string) {
        let { data: questions, error } = await this.supabase
            .from('questions')
            .select('*')
            .eq('survey_id', surveyId)
        if (!questions) return
        this.questions.set(questions)
    }

    /**
     * Fetches all responses for a given question from the Supabase database and updates the responses signal. This method is called when a question is selected to load its associated responses. It uses the Supabase client to query the 'responses' table, filtering by the provided question ID. If the query is successful, the retrieved responses are stored in the responses signal, which can then be used to display the responses for the selected question. If there is an error during the fetch, it is logged to the console.
     */
    async getResponses(questionId: string) {
        let { data: responses, error } = await this.supabase
            .from('responses')
            .select('*')
            .eq('question_id', questionId)
        if (!responses) return
        this.responses.set(responses)
    }

    /**
     * Builds the payload for inserting a new survey into the database. It takes the form data as input and constructs an object that matches the structure expected by the 'surveys' table in Supabase. The method also determines the is_active status based on the end date, setting it to true if there is no end date or if the end date is in the future. This payload is then used when inserting a new survey into the database.
     */
    private buildSurveyPayload(data: { title: string, description: string | null, end_date: string | null, category: string }) {
        return {
            title: data.title,
            description: data.description,
            end_date: data.end_date,
            category: data.category,
            is_active: data.end_date ? new Date(data.end_date) >= new Date() : true
        };
    }

    /**
     * Inserts a new survey into the Supabase database using the provided form data. It first builds the payload using the buildSurveyPayload method, then uses the Supabase client to insert the new survey into the 'surveys' table. If the insertion is successful, the newly created survey is returned. If there is an error during insertion, it is logged to the console.
     */
    async insertSurvey(data: { title: string, description: string | null, end_date: string | null, category: string }) {
        const { data: survey, error } = await this.supabase
            .from('surveys')
            .insert(this.buildSurveyPayload(data))
            .select()
            .single();
        if (error) console.error(error);
        return survey;
    }

    /**
     * Inserts questions for a given survey into the Supabase database. It takes the survey ID and an array of questions as input, constructs the appropriate payload for each question, and uses the Supabase client to insert them into the 'questions' table. Each question includes the survey ID, question text, options (mapped from the form answers), sort order, and whether multiple answers are allowed. If there is an error during insertion, it is logged to the console.
     */
    async insertQuestions(surveyId: string, questions: any[]) {
        const rows = questions.map((q, i) => ({
            survey_id: surveyId,
            question_text: q.text,
            options: q.answers.map((a: any) => ({ letter: a.letter, value: a.value })),
            sort_order: i + 1,
            allow_multiple: q.allowMultiple
        }))
        const { error } = await this.supabase
            .from('questions')
            .insert(rows)
        if (error) console.error(error)
    }

    /**
     * Submits a response to a survey question by inserting it into the 'responses' table in the Supabase database. It takes the survey ID, question ID, answer value, and respondent token as input, constructs the appropriate payload, and uses the Supabase client to insert the response. The respondent token is used to group responses from the same user without requiring authentication. If there is an error during insertion, it is logged to the console.
     */
    async submitResponse(surveyId: string, questionId: string, answerValue: string, respondentToken: string) {
        const { error } = await this.supabase
            .from('responses')
            .insert({
                survey_id: surveyId,
                question_id: questionId,
                answer_value: answerValue,
                respondent_token: respondentToken
            })
        if (error) console.error(error)
    }

    /**
     * Fetches aggregated results for a given survey from the Supabase database. It queries the 'responses' table to retrieve the question ID and answer value for all responses associated with the specified survey ID. This data can then be used to calculate the counts and percentages for each answer option in the survey results. If there is an error during the fetch, it is logged to the console, and an empty array is returned.
     */
    async getResults(surveyId: string) {
        const { data, error } = await this.supabase
            .from('responses')
            .select('question_id, answer_value')
            .eq('survey_id', surveyId)
        if (error) console.error(error)
        return data ?? []
    }

    /**
     * Subscribes to realtime INSERT events on the surveys table. Calls the provided callback with the new survey row. Returns the channel so the caller can unsubscribe on destroy.
     */
    subscribeToSurveys(onInsert: (survey: Survey) => void) {
        return this.supabase
            .channel('surveys-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'surveys' },
                (payload) => onInsert(payload.new as Survey)
            )
            .subscribe();
    }
}