export interface Author {
  name?: string;
  instagram?: string;
}

export interface Photo {
  id: number;
  path: string;
  image_name: string | null;
  subjects: string | null;
  style: string;
  modern_traditional: string;
  placement: string;
  how: string;
  color: string;
  author: Author;
}

export interface FilterOptions {
  subjects: string[];
  styles: string[];
  modern_traditional: string[];
  placements: string[];
  how: string[];
  colors: string[];
  authors: string[];
}

export interface ActiveFilters {
  subject: string[];
  style: string[];
  modern_traditional: string[];
  placement: string[];
  how: string[];
  color: string[];
  author_name: string[];
}

export interface ExtractedResult {
  photo: Photo;
  extracted: {
    name: string;
    subjects: string[];
    style: string[];
    modern_traditional: string;
    placement: string[];
    how: string;
    color: string;
    author: {
      name: string;
      instagram: string;
    };
  };
  filename: string;
}
