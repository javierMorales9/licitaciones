import type { ParsedParty } from "../feedParser.js";

export class Party {
  id?: string | undefined;
  nif: string;
  updated: Date;
  profile_url?: string;
  website?: string;
  dir3?: string;
  name?: string;
  address?: string;
  zip?: string;
  city?: string;
  countryCode?: string;
  country?: string;
  phone?: string;
  email?: string;

  constructor(args: {
    id?: string;
    nif: string;
    updated: Date;
    profile_url?: string;
    website?: string;
    dir3?: string;
    name?: string;
    address?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  }) {
    this.id = args.id;
    this.nif = args.nif;
    this.profile_url = args.profile_url;
    this.updated = args.updated;
    this.website = args.website;
    this.dir3 = args.dir3;
    this.name = args.name;
    this.address = args.address;
    this.zip = args.zip;
    this.city = args.city;
    this.countryCode = args.countryCode;
    this.country = args.country;
    this.phone = args.phone;
    this.email = args.email;
  }

  static fromParsed(p: {
    nif: string;
    profile_url?: string;
    updated: string;
    website?: string;
    dir3?: string;
    name?: string;
    address?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  }): Party {
    return new Party({
      nif: p.nif,
      updated: new Date(p.updated),
      profile_url: p.profile_url,
      website: p.website,
      dir3: p.dir3,
      name: p.name,
      address: p.address,
      zip: p.zip,
      city: p.city,
      countryCode: p.countryCode,
      country: p.country,
      phone: p.phone,
      email: p.email,
    });
  }

  static fromDb(row: {
    id?: string;
    nif?: string;
    updated: string;
    profile_url?: string;
    website?: string;
    dir3?: string;
    name?: string;
    address?: string;
    zip?: string;
    city?: string;
    countryCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  }): Party {
    if (!row.nif) {
      throw new Error("fromDb: 'nif' es obligatorio");
    }
    return new Party({
      id: row.id,
      nif: row.nif,
      updated: new Date(row.updated),
      profile_url: row.profile_url,
      website: row.website,
      dir3: row.dir3,
      name: row.name,
      address: row.address,
      zip: row.zip,
      city: row.city,
      countryCode: row.countryCode,
      country: row.country,
      phone: row.phone,
      email: row.email,
    });
  }

  update(newData: Partial<ParsedParty>): void {
    for (const [key, value] of Object.entries(newData)) {
      if (value !== undefined && value !== null) {
        (this as any)[key] = value;
      }
    }
  }
}


