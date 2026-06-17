export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string | null
          data_hora: string
          dentista_id: string
          id: string
          observacoes: string | null
          paciente_id: string
          status: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          data_hora: string
          dentista_id: string
          id?: string
          observacoes?: string | null
          paciente_id: string
          status?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          data_hora?: string
          dentista_id?: string
          id?: string
          observacoes?: string | null
          paciente_id?: string
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_agendamento_dentista"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agendamento_paciente"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese: {
        Row: {
          alergias: string | null
          historico_medico: string | null
          id: string
          medicamentos: string | null
          paciente_id: string
          updated_at: string | null
        }
        Insert: {
          alergias?: string | null
          historico_medico?: string | null
          id?: string
          medicamentos?: string | null
          paciente_id: string
          updated_at?: string | null
        }
        Update: {
          alergias?: string | null
          historico_medico?: string | null
          id?: string
          medicamentos?: string | null
          paciente_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_anamnese_paciente"
            columns: ["paciente_id"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      convenios: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          tabela_cobertura: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          tabela_cobertura?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          tabela_cobertura?: Json | null
        }
        Relationships: []
      }
      dentistas: {
        Row: {
          created_at: string | null
          cro: string | null
          email: string | null
          especialidade: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          created_at?: string | null
          cro?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          created_at?: string | null
          cro?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      estoque: {
        Row: {
          categoria: string | null
          created_at: string | null
          fornecedor: string | null
          id: string
          nome: string
          quantidade_atual: number | null
          quantidade_minima: number | null
          unidade: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          fornecedor?: string | null
          id?: string
          nome: string
          quantidade_atual?: number | null
          quantidade_minima?: number | null
          unidade?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          fornecedor?: string | null
          id?: string
          nome?: string
          quantidade_atual?: number | null
          quantidade_minima?: number | null
          unidade?: string | null
        }
        Relationships: []
      }
      estoque_movimentacoes: {
        Row: {
          data: string | null
          estoque_id: string
          id: string
          motivo: string | null
          quantidade: number | null
          tipo: string | null
          usuario_id: string | null
        }
        Insert: {
          data?: string | null
          estoque_id: string
          id?: string
          motivo?: string | null
          quantidade?: number | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Update: {
          data?: string | null
          estoque_id?: string
          id?: string
          motivo?: string | null
          quantidade?: number | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mov_estoque"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          convenio_guia: string | null
          created_at: string | null
          data_pagamento: string | null
          forma_pagamento: string | null
          id: string
          paciente_id: string
          parcelas: number | null
          status: string | null
          tratamento_id: string | null
          valor: number
        }
        Insert: {
          convenio_guia?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?: string | null
          id?: string
          paciente_id: string
          parcelas?: number | null
          status?: string | null
          tratamento_id?: string | null
          valor: number
        }
        Update: {
          convenio_guia?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento?: string | null
          id?: string
          paciente_id?: string
          parcelas?: number | null
          status?: string | null
          tratamento_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_financeiro_paciente"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financeiro_tratamento"
            columns: ["tratamento_id"]
            isOneToOne: false
            referencedRelation: "tratamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograma: {
        Row: {
          data: string | null
          dente_numero: number
          dentista_id: string | null
          face: string | null
          id: string
          observacao: string | null
          paciente_id: string
          status: string | null
        }
        Insert: {
          data?: string | null
          dente_numero: number
          dentista_id?: string | null
          face?: string | null
          id?: string
          observacao?: string | null
          paciente_id: string
          status?: string | null
        }
        Update: {
          data?: string | null
          dente_numero?: number
          dentista_id?: string | null
          face?: string | null
          id?: string
          observacao?: string | null
          paciente_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_odontograma_dentista"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_odontograma_paciente"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          convenio_id: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          convenio_id?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_paciente_convenio"
            columns: ["convenio_id"]
            isOneToOne: false
            referencedRelation: "convenios"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuario_evolucao: {
        Row: {
          data: string | null
          dentista_id: string
          id: string
          paciente_id: string
          texto: string
        }
        Insert: {
          data?: string | null
          dentista_id: string
          id?: string
          paciente_id: string
          texto: string
        }
        Update: {
          data?: string | null
          dentista_id?: string
          id?: string
          paciente_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_evolucao_dentista"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evolucao_paciente"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      tratamentos: {
        Row: {
          created_at: string | null
          data_conclusao: string | null
          data_prevista: string | null
          dente_numero: number | null
          dentista_id: string
          id: string
          paciente_id: string
          procedimento: string
          status: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          dente_numero?: number | null
          dentista_id: string
          id?: string
          paciente_id: string
          procedimento: string
          status?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          dente_numero?: number | null
          dentista_id?: string
          id?: string
          paciente_id?: string
          procedimento?: string
          status?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tratamento_dentista"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tratamento_paciente"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          nome: string
          papel: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          papel?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          papel?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
