export interface KisTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface KisPriceResponse {
  output: {
    stck_prpr: string;
    prdy_vrss: string;
    prdy_vrss_sign: string;
    prdy_ctrt: string;
    acml_vol: string;
    acml_tr_pbmn: string;
    stck_oprc: string;
    stck_hgpr: string;
    stck_lwpr: string;
    per: string;
    pbr: string;
    hts_avls: string;
  };
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}

export interface KisDailyPriceItem {
  stck_bsop_date: string;
  stck_clpr: string;
  stck_oprc: string;
  stck_hgpr: string;
  stck_lwpr: string;
  acml_vol: string;
  prdy_vrss: string;
  prdy_vrss_sign: string;
}

export interface KisDailyPriceResponse {
  output: KisDailyPriceItem[];
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}

export interface KisInvestorItem {
  stck_bsop_date: string;
  prsn_ntby_qty: string;
  frgn_ntby_qty: string;
  orgn_ntby_qty: string;
}

export interface KisInvestorResponse {
  output: KisInvestorItem[];
  rt_cd: string;
  msg_cd: string;
  msg1: string;
}
