

export interface IssuanceStatus {
  type:  
    | 'Created'
        | 'Finalised'
    ;
}

export interface Issuance { 
  generation_hashes: Array<EntryHash>;

  transaction: string | undefined;

  quantity: number;

  status: IssuanceStatus;
}

