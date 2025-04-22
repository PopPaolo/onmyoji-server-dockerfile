declare global {
  type Note = {
    soil: string;
    oil?: string;
    gold?: string;
    gems?: string;
    author: string;
    platform_id: number;
    format_id: number;
    source_link: string;
  };
}

export {};
