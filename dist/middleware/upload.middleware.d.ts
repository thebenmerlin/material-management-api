export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const handleUploadError: (error: any, req: any, res: any, next: any) => any;
export declare const deleteUploadedFiles: (files: Express.Multer.File[]) => void;
export declare const serveUploads: (req: any, res: any, next: any) => any;
//# sourceMappingURL=upload.middleware.d.ts.map