


export interface IssuanceStatus {
  type:  
    | 'Created'
        | 'Finalised'
    ;
}

export interface Issuance { 
  generation_hashes: Array<ActionHash>;

  transaction: string | undefined;

  quantity: number;

  status: IssuanceStatus;
}

