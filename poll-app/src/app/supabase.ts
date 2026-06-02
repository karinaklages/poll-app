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
    question_type: string
    options: any | null
    sort_order: number
    is_required: boolean
    created_at: string
}

interface Response {
    id: string
    question_id: string | null
    answer_value: string 
    respondent_token: string
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

    async getSurveys() {
        let { data: surveys, error } = await this.supabase
            .from('surveys')
            .select('*')
        if (!surveys) return
        this.surveys.set(surveys)
    }

    async getQuestions(surveyId: string) {
        let { data: questions, error } = await this.supabase
            .from('questions')
            .select('*')
            .eq('survey_id', surveyId)
        if (!questions) return
        this.questions.set(questions)
    }

    async getResponses(questionId: string) {
        let { data: responses, error } = await this.supabase
            .from('responses')
            .select('*')
            .eq('question_id', questionId)
        if (!responses) return
        this.responses.set(responses)
    }

    async insertSurvey(data: { title: string, description: string | null, end_date: string | null, category: string }) {
        const is_active = data.end_date ? new Date(data.end_date) >= new Date() : true
        
        const { data: survey, error } = await this.supabase
            .from('surveys')
            .insert({
                title: data.title,
                description: data.description,
                end_date: data.end_date,
                category: data.category,
                is_active
            })
            .select()
            .single()

        if (error) console.error(error)
        return survey
    }
}