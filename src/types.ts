export interface ProbRow {
  Window: string;
  NQ_DB_Prob: number;
  ES_DB_Prob: number;
  [key: string]: any;
}

export interface ProbFirstRow {
  Window: string;
  NQ_H_First_L_Break_Prob: number;
  NQ_H_First_CBM_Prob: number;
  NQ_L_First_H_Break_Prob: number;
  NQ_L_First_CAM_Prob: number;
  NQ_Comb_Opp_Prob: number;
  NQ_Comb_Cond_Prob: number;
  [key: string]: any;
}

export interface CorrRow {
  Window: string;
  'ES High Break (NQ Follows)': number;
  'ES Low Break (NQ Follows)': number;
  'NQ High Break (ES Follows)': number;
  'NQ Low Break (ES Follows)': number;
  [key: string]: any;
}

export interface ExtRow {
  Window: string;
  '1%': number;
  '5%': number;
  '10%': number;
  '25%': number;
  '50%': number;
  '75%': number;
  '90%': number;
  '95%': number;
  '100%': number;
  [key: string]: any;
}

export interface DataPayload {
  prob: ProbRow[];
  prob_first: ProbFirstRow[];
  corr?: CorrRow[];
  close_pos?: any[];
  ext: {
    nq: {
      double_break: { combined: ExtRow[]; high_first: ExtRow[]; low_first: ExtRow[] };
      single_break: { combined: ExtRow[]; high_first: ExtRow[]; low_first: ExtRow[] };
      all_breaks: { combined: ExtRow[]; high_first: ExtRow[]; low_first: ExtRow[] };
    };
    es: {
      double_break: { combined: ExtRow[]; high_first: ExtRow[]; low_first: ExtRow[] };
      single_break: { combined: ExtRow[]; high_first: ExtRow[]; low_first: ExtRow[] };
      all_breaks: { combined: ExtRow[]; high_first: ExtRow[]; low_first: ExtRow[] };
    };
  };
}
