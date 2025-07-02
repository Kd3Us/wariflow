export interface IBusinessModelForm {
  market: string;
  pricing: string;
}

export class BusinessModelForm implements IBusinessModelForm {
  constructor() {}
  market = "";
  pricing = "";
}