/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "{scheme}://{host}",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Beam Deflection API
 * @version v1
 * @baseUrl {scheme}://{host}
 *
 * JSON API for managing beams, beam deflection calculations, and moderation workflows.
 *
 * **Authentication**: JWT tokens (Bearer format) issued by /api/auth/sign_in or /api/auth/sign_up
 *
 * **Security**: Tokens are blacklisted on sign out using Redis. Blacklisted tokens return 401 Unauthorized.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthSignIn
     * @summary Sign in and receive JWT
     * @request POST:/api/auth/sign_in
     */
    authSignIn: (
      data: {
        /**
         * @format email
         * @example "user@example.com"
         */
        email: string;
        /** @example "secret123" */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          token?: string;
          user?: {
            id?: number;
            email?: string;
            moderator?: boolean;
          };
        },
        void
      >({
        path: `/api/auth/sign_in`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthSignUp
     * @summary Register and receive JWT
     * @request POST:/api/auth/sign_up
     */
    authSignUp: (
      data: {
        /** @format email */
        email: string;
        /** @minLength 6 */
        password: string;
        password_confirmation: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          token?: string;
          user?: {
            id?: number;
            email?: string;
            moderator?: boolean;
          };
        },
        void
      >({
        path: `/api/auth/sign_up`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Signs out the current user by adding their JWT token to the Redis blacklist. The token will be rejected on all future requests until it naturally expires.
     *
     * @tags Auth
     * @name AuthSignOut
     * @summary Sign out and blacklist JWT token
     * @request POST:/api/auth/sign_out
     * @secure
     */
    authSignOut: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "Successfully signed out" */
          message?: string;
        },
        void
      >({
        path: `/api/auth/sign_out`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Me
     * @name MeShow
     * @summary Current user profile
     * @request GET:/api/me
     * @secure
     */
    meShow: (params: RequestParams = {}) =>
      this.request<
        {
          id?: number;
          email?: string;
          moderator?: boolean;
        },
        any
      >({
        path: `/api/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Me
     * @name MeUpdate
     * @summary Update current user credentials
     * @request PUT:/api/me
     * @secure
     */
    meUpdate: (
      data: {
        /** @format email */
        email?: string;
        /** @minLength 6 */
        password?: string;
        password_confirmation?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          id?: number;
          email?: string;
          moderator?: boolean;
        },
        any
      >({
        path: `/api/me`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsCartBadge
     * @summary Get current draft id and items count
     * @request GET:/api/beam_deflections/cart_badge
     * @secure
     */
    beamDeflectionsCartBadge: (params: RequestParams = {}) =>
      this.request<
        {
          beam_deflection_id?: number;
          items_count?: number;
        },
        void
      >({
        path: `/api/beam_deflections/cart_badge`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns list of beam deflections (заявки). - **Regular users**: see only their own non-draft beam deflections - **Moderators**: see ALL non-deleted beam deflections (including drafts) - Deleted beam deflections are always excluded - Supports filtering by status and date range
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsList
     * @summary List beam deflections (заявки)
     * @request GET:/api/beam_deflections
     * @secure
     */
    beamDeflectionsList: (
      query?: {
        /** Filter by status (draft, formed, completed, rejected). Note - draft only visible to moderators. */
        status?: "draft" | "formed" | "completed" | "rejected";
        /**
         * Filter formed_at from date (YYYY-MM-DD)
         * @format date
         */
        from?: string;
        /**
         * Filter formed_at to date (YYYY-MM-DD)
         * @format date
         */
        to?: string;
        /**
         * Page number (default 1)
         * @min 1
         */
        page?: number;
        /**
         * Items per page (default 20, max 100)
         * @min 1
         * @max 100
         */
        per_page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          beam_deflections?: {
            id?: number;
            status?: string;
            /** @format date-time */
            formed_at?: string;
            /** @format date-time */
            completed_at?: string;
            note?: string;
            creator_login?: string;
            moderator_login?: string;
            result_deflection_mm?: number;
          }[];
          meta?: {
            current_page?: number;
            next_page?: number;
            prev_page?: number;
            total_pages?: number;
            total_count?: number;
          };
        },
        void
      >({
        path: `/api/beam_deflections`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsShow
     * @summary Get beam deflection by ID
     * @request GET:/api/beam_deflections/{id}
     * @secure
     */
    beamDeflectionsShow: (id: number, params: RequestParams = {}) =>
      this.request<
        {
          id?: number;
          status?: string;
          note?: string;
          /** @format date-time */
          formed_at?: string;
          /** @format date-time */
          completed_at?: string;
          creator_login?: string;
          moderator_login?: string;
          result_deflection_mm?: number;
          within_norm?: boolean;
          items?: {
            beam_id?: number;
            beam_name?: string;
            beam_material?: string;
            beam_image_url?: string | null;
            quantity?: number;
            length_m?: number | null;
            udl_kn_m?: number | null;
            position?: number;
            deflection_mm?: number;
          }[];
        },
        void
      >({
        path: `/api/beam_deflections/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsUpdate
     * @summary Update beam deflection (draft or formed only)
     * @request PUT:/api/beam_deflections/{id}
     * @secure
     */
    beamDeflectionsUpdate: (
      id: number,
      data: {
        beam_deflection?: {
          note?: string;
        };
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          id?: number;
          status?: string;
          note?: string;
          /** @format date-time */
          formed_at?: string;
          /** @format date-time */
          completed_at?: string;
          creator_login?: string;
          moderator_login?: string;
          result_deflection_mm?: number;
          within_norm?: boolean;
          items?: {
            beam_id?: number;
            beam_name?: string;
            beam_material?: string;
            beam_image_url?: string | null;
            quantity?: number;
            length_m?: number | null;
            udl_kn_m?: number | null;
            position?: number;
            deflection_mm?: number;
          }[];
        },
        void
      >({
        path: `/api/beam_deflections/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsDelete
     * @summary Delete (soft delete) beam deflection
     * @request DELETE:/api/beam_deflections/{id}
     * @secure
     */
    beamDeflectionsDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/beam_deflections/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsUpdateItem
     * @summary Update item inside draft beam deflection
     * @request PUT:/api/beam_deflections/{beam_deflection_id}/items/update_item
     * @secure
     */
    beamDeflectionsUpdateItem: (
      beamDeflectionId: number,
      data: {
        beam_id: number;
        beam_deflection_beam: {
          /** @min 1 */
          quantity?: number;
          /** @min 0.001 */
          length_m?: number | null;
          /** @min 0 */
          udl_kn_m?: number | null;
          /** @min 1 */
          position?: number;
        };
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/api/beam_deflections/${beamDeflectionId}/items/update_item`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsRemoveItem
     * @summary Remove item from draft beam deflection
     * @request DELETE:/api/beam_deflections/{beam_deflection_id}/items/remove_item
     * @secure
     */
    beamDeflectionsRemoveItem: (
      beamDeflectionId: number,
      query: {
        beam_id: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/api/beam_deflections/${beamDeflectionId}/items/remove_item`,
        method: "DELETE",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsForm
     * @summary Validate draft and mark as formed (user only)
     * @request PUT:/api/beam_deflections/{id}/form
     * @secure
     */
    beamDeflectionsForm: (id: number, params: RequestParams = {}) =>
      this.request<
        {
          id?: number;
          status?: string;
          note?: string;
          /** @format date-time */
          formed_at?: string;
          /** @format date-time */
          completed_at?: string;
          creator_login?: string;
          moderator_login?: string;
          result_deflection_mm?: number;
          within_norm?: boolean;
          items?: {
            beam_id?: number;
            beam_name?: string;
            beam_material?: string;
            beam_image_url?: string | null;
            quantity?: number;
            length_m?: number | null;
            udl_kn_m?: number | null;
            position?: number;
            deflection_mm?: number;
          }[];
        },
        void
      >({
        path: `/api/beam_deflections/${id}/form`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Calculates deflection results and marks beam deflection as completed. Only moderators can perform this action. Beam deflection must be in 'formed' status.
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsComplete
     * @summary Complete formed beam deflection (moderator only)
     * @request PUT:/api/beam_deflections/{id}/complete
     * @secure
     */
    beamDeflectionsComplete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/beam_deflections/${id}/complete`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * @description Rejects a beam deflection that is in 'formed' status. Only moderators can perform this action.
     *
     * @tags BeamDeflections
     * @name BeamDeflectionsReject
     * @summary Reject formed beam deflection (moderator only)
     * @request PUT:/api/beam_deflections/{id}/reject
     * @secure
     */
    beamDeflectionsReject: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/api/beam_deflections/${id}/reject`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Beams
     * @name BeamsList
     * @summary List beams (public)
     * @request GET:/api/beams
     */
    beamsList: (
      query?: {
        /** Search query (by name) */
        q?: string;
        /** Include inactive beams (pass active=false) */
        active?: boolean;
        /**
         * Page number (default 1)
         * @min 1
         */
        page?: number;
        /**
         * Items per page (default 20, max 100)
         * @min 1
         * @max 100
         */
        per_page?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          beams?: {
            id?: number;
            name?: string;
            description?: string | null;
            active?: boolean;
            image_url?: string | null;
            image_key?: string | null;
            material?: string;
            elasticity_gpa?: number;
            inertia_cm4?: number;
            allowed_deflection_ratio?: number;
          }[];
          meta?: {
            current_page?: number;
            next_page?: number;
            prev_page?: number;
            total_pages?: number;
            total_count?: number;
          };
        },
        any
      >({
        path: `/api/beams`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Beams
     * @name BeamsCreate
     * @summary Create beam (moderator only)
     * @request POST:/api/beams
     * @secure
     */
    beamsCreate: (
      data: {
        name: string;
        material: "wooden" | "steel" | "reinforced_concrete";
        elasticity_gpa: number;
        inertia_cm4: number;
        allowed_deflection_ratio: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/api/beams`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Beams
     * @name BeamsShow
     * @summary Fetch beam details (public)
     * @request GET:/api/beams/{id}
     */
    beamsShow: (id: number, params: RequestParams = {}) =>
      this.request<
        {
          id?: number;
          name?: string;
          description?: string | null;
          active?: boolean;
          image_url?: string | null;
          image_key?: string | null;
          material?: string;
          elasticity_gpa?: number;
          inertia_cm4?: number;
          allowed_deflection_ratio?: number;
        },
        any
      >({
        path: `/api/beams/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Beams
     * @name BeamsUpdate
     * @summary Update beam (moderator only)
     * @request PUT:/api/beams/{id}
     * @secure
     */
    beamsUpdate: (
      id: number,
      data: {
        name?: string;
        material?: string;
        allowed_deflection_ratio?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/beams/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Beams
     * @name BeamsDelete
     * @summary Delete beam (moderator only)
     * @request DELETE:/api/beams/{id}
     * @secure
     */
    beamsDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/beams/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Beams
     * @name BeamsAddToDraft
     * @summary Add beam to current draft beam deflection
     * @request POST:/api/beams/{id}/add_to_draft
     * @secure
     */
    beamsAddToDraft: (
      id: number,
      query?: {
        /** @min 1 */
        quantity?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          beam_deflection_id?: number;
          items_count?: number;
        },
        void
      >({
        path: `/api/beams/${id}/add_to_draft`,
        method: "POST",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
