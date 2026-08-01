import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryManagement } from '@/backend/route-params';
import type {
  CategoryStatus,
  CategoryItem,
  GetCategoryListOutput,
  KeywordGroupType,
  KeywordGroupSummary,
  KeywordItemNode,
  HomepagePosterConfig,
  HomepagePosterItem,
  CategoryRecommendedKeywordItem,
  PosterAspectPreset,
  CategoryOption,
  CategoryDisplayConfig,
  CreateCategoryInput,
  BatchCreateSubcategoriesInput,
  UpdateCategoryInput,
  SaveHomepagePosterConfigInput,
  SaveCategoryRecommendedKeywordsInput,
  CreateKeywordGroupInput,
  UpdateKeywordGroupInput,
  CreateKeywordItemInput,
  UpdateKeywordItemInput,
  BatchApplyKeywordsInput,
} from '@/backend/actions/CategoryManagement';
import {
  getCategoryList,
  createCategory,
  updateCategory,
  saveHomepagePosterConfig,
  deleteCategory,
  saveCategoryRecommendedKeywords,
  saveCategoryTopPromotionConfig,
  batchCreateSubcategories,
  createKeywordGroup,
  updateKeywordGroup,
  deleteKeywordGroup,
  createKeywordItem,
  updateKeywordItem,
  deleteKeywordItem,
  batchUpsertKeywordItems,
  batchApplyKeywordsToCategories,
  searchKeywordGroupProducts,
  removeKeywordGroupProductLink,
  batchRemoveKeywordGroupProductLinks,
  batchDeleteCategories,
  batchUpdateCategoryStatus,
  batchMoveCategoryParent,
  updateCategoryStatus,
  updateCategorySortWeight,
  updateCategoryPriceCoefficient,
  batchUpdateCategorySortWeight,
} from '@/backend/actions/CategoryManagement';
import { toast } from 'sonner';
import { canEditCategoryPriceCoefficient } from '@/shared/categoryPricing';

export const STATUS_LABELS: Record<CategoryStatus, string> = {
  ACTIVE: '激活',
  INACTIVE: '停用',
};

export const LEVEL_LABELS: Record<CategoryLevel, string> = {
  1: '一级分类',
  2: '二级分类',
};

export const GROUP_TYPE_LABELS: Record<KeywordGroupType, string> = {
  BRAND: '品牌类',
  NEW_ARRIVAL: '当日上新类',
  PROMOTION: '促销类',
  GENERAL: '通用类',
};

export const POSTER_ASPECT_PRESET_LABELS: Record<PosterAspectPreset, string> = {
  CROSS_BORDER_HERO: '跨境电商海报',
  WIDE_BANNER: '宽幅横版',
  SQUARE: '方形方图',
};

export interface RecommendedKeywordFormItem {
  category_id: string;
  category_name: string;
  category_slug: string | null;
  sort_weight: number;
  is_active: boolean;
}

export type CategoryLevel = 1 | 2;

type CategoryTopPromotionConfigValue = {
  enabled: boolean;
  message: string;
  end_time: string | null;
  background_color: string;
  text_color: string;
};

type KeywordGroupProductBindingInputCompat = {
  product_id: string;
  sort_weight?: number;
};

type KeywordGroupBoundProductSummaryCompat = {
  product_id: string;
  product_name: string;
  product_slug: string | null;
  sku_code: string | null;
  image_url: string | null;
  price: number | null;
  created_at: string;
  sort_weight: number;
};

type KeywordGroupSummaryCompat = KeywordGroupSummary & {
  linked_products?: KeywordGroupBoundProductSummaryCompat[];
  linked_product_count?: number;
  scene_key?: string | null;
  scene_type?: string | null;
  floor_title?: string | null;
  floor_icon?: string | null;
  floor_link?: string | null;
  homepage_sort_weight?: number;
  show_on_homepage?: boolean;
};

type GetCategoryListResult = GetCategoryListOutput & {
  keyword_operation_data: GetCategoryListOutput['keyword_operation_data'] & {
    group_summaries: KeywordGroupSummaryCompat[];
  };
  top_promotion_config: CategoryTopPromotionConfigValue;
  recommended_keyword_items: (CategoryRecommendedKeywordItem & RecommendedKeywordFormItem)[];
};

export interface FormFields {
  category_name: string;
  category_slug: string;
  parent_id: string | null;
  level: CategoryLevel;
  image_url: string;
  banner_image_url: string;
  description: string;
  sort_weight: number;
  status: CategoryStatus;
  category_kind: 'MAIN' | 'BRAND';
  brand_keywords_text: string;
  price_coefficient: number | null;
  category_display_config: CategoryDisplayConfig;
}

export interface KeywordGroupForm {
  keyword_group_id: string | null;
  name: string;
  slug: string;
  group_type: KeywordGroupType;
  scene_key: string;
  scene_type: string;
  description: string;
  floor_title: string;
  floor_icon: string;
  floor_link: string;
  homepage_sort_weight: number;
  show_on_homepage: boolean;
  sort_weight: number;
  is_active: boolean;
  linked_products: KeywordGroupProductBindingInputCompat[];
}

export interface KeywordItemForm {
  keyword_item_id: string | null;
  keyword_group_id: string;
  parent_keyword_id: string | null;
  keyword: string;
  sort_weight: number;
  is_active: boolean;
}

export interface BatchKeywordItemDraft {
  temp_id: string;
  keyword_item_id: string | null;
  keyword: string;
  parent_keyword_id: string | null;
  sort_weight: number;
  is_active: boolean;
}

export interface BatchKeywordApplyForm {
  keyword_group_id: string;
  keyword_item_ids: string[];
  category_ids: string[];
  apply_to_homepage: boolean;
}

export interface BatchActionFeedback {
  success_count: number;
  failed_count: number;
  failed_messages: string[];
}

export interface KeywordProductSearchState {
  list: KeywordGroupBoundProductSummaryCompat[];
  total: number;
  page: number;
  page_size: number;
}

export interface KeywordProductFilters {
  keyword: string;
  spu: string;
  min_price: string;
  max_price: string;
  scene_key: string;
  scene_type: string;
}

export interface TopPromotionForm {
  enabled: boolean;
  message: string;
  end_time: string;
  background_color: string;
  text_color: string;
}

type SearchKeywordGroupProductsResultCompat = {
  list: KeywordGroupBoundProductSummaryCompat[];
  total: number;
  page: number;
  page_size: number;
};

interface KeywordProductQuerySnapshot {
  keyword_group_id: string | null;
  relationScope: 'LINKED' | 'UNLINKED';
  filters: KeywordProductFilters;
  page: number;
  page_size: number;
}

export interface CategoryManagementState {
  list: CategoryItem[];
  total: number;
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  searchInput: string;
  activeKeyword: string;
  status: 'ALL' | CategoryStatus;
  levelFilter: 'ALL' | '1' | '2';
  categoryId: string | null;
  inlineNameEditingId: string | null;
  inlineNameValue: string;
  isInlineNameSaving: boolean;
  weightInputs: Record<string, string>;
  coefficientInputs: Record<string, string>;
  isDrawerOpen: boolean;
  editingId: string | null;
  formData: FormFields;
  isSubmitting: boolean;
  deleteItem: CategoryItem | null;
  isDeleting: boolean;
  parentOptions: CategoryOption[];
  posterConfigs: HomepagePosterConfig[];
  recommendedKeywordItems: RecommendedKeywordFormItem[];
  recommendedKeywordDrafts: RecommendedKeywordFormItem[];
  isSavingRecommendedKeywords: boolean;
  topPromotionForm: TopPromotionForm;
  isSavingTopPromotion: boolean;
  isPosterDrawerOpen: boolean;
  posterForm: HomepagePosterConfig;
  isSavingPoster: boolean;
  quickCreateParentId: string | null;
  quickCreateNames: string;
  isQuickCreating: boolean;
  expandedPreviewProducts: Record<string, boolean>;
  selectedCategoryIds: string[];
  batchTargetParentId: string | null;
  isBatchProcessing: boolean;
  keywordGroups: KeywordGroupSummaryCompat[];
  keywordCategoryOptions: CategoryOption[];
  selectedKeywordGroupId: string | null;
  expandedKeywordGroups: Record<string, boolean>;
  expandedKeywordParents: Record<string, boolean>;
  isKeywordGroupDialogOpen: boolean;
  keywordGroupForm: KeywordGroupForm;
  isSavingKeywordGroup: boolean;
  productSearchInput: string;
  keywordProductRelationScope: 'LINKED' | 'UNLINKED';
  keywordProductFilters: KeywordProductFilters;
  productSearchState: KeywordProductSearchState;
  isProductSearchLoading: boolean;
  selectedKeywordProductIds: string[];
  activeKeywordProductQuery: KeywordProductQuerySnapshot | null;
  isKeywordItemDialogOpen: boolean;
  keywordItemForm: KeywordItemForm;
  isSavingKeywordItem: boolean;
  isBatchKeywordItemDialogOpen: boolean;
  batchKeywordItemGroupId: string;
  batchKeywordItemParentId: string | null;
  batchKeywordItemDrafts: BatchKeywordItemDraft[];
  isSavingBatchKeywordItems: boolean;
  deletingKeywordGroupId: string | null;
  deletingKeywordItemId: string | null;
  batchKeywordApplyForm: BatchKeywordApplyForm;
  isBatchKeywordDialogOpen: boolean;
  isApplyingKeywords: boolean;
  keywordSearchInput: string;
  batchFeedback: BatchActionFeedback | null;
}

export interface CategoryManagementHandlers {
  setPage: React.Dispatch<React.SetStateAction<number>>;
  handlePageSizeChange: (nextPageSize: number) => void;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
  handleTabChange: (value: 'ALL' | CategoryStatus) => void;
  handleLevelChange: (value: 'ALL' | '1' | '2') => void;
  openCreateDrawer: (level?: CategoryLevel, parentId?: string | null) => void;
  closeDrawer: () => void;
  handleFormChange: <K extends keyof FormFields>(field: K, value: FormFields[K]) => void;
  submitForm: () => Promise<void>;
  startInlineNameEdit: (item: CategoryItem) => void;
  changeInlineNameValue: (value: string) => void;
  submitInlineNameEdit: (item: CategoryItem) => Promise<void>;
  cancelInlineNameEdit: () => void;
  handleInlineStatusChange: (item: CategoryItem, checked: boolean) => Promise<void>;
  handleInlineWeightChange: (categoryId: string, value: string) => void;
  handleInlineWeightBlur: (item: CategoryItem) => Promise<void>;
  handleInlineCoefficientChange: (categoryId: string, value: string) => void;
  handleInlineCoefficientBlur: (item: CategoryItem) => Promise<void>;
  onLevel1DragStart: (index: number) => void;
  onLevel1DragEnter: (index: number) => void;
  onLevel1DragEnd: () => Promise<void>;
  setDeleteItem: (item: CategoryItem | null) => void;
  confirmDelete: () => Promise<void>;
  navigateToDetail: (categoryId: string) => void;
  openPosterDrawer: (item: CategoryItem) => void;
  closePosterDrawer: () => void;
  addPosterItem: () => void;
  removePosterItem: (posterId: string) => void;
  updatePosterItem: (posterId: string, field: keyof HomepagePosterItem, value: string | number | boolean) => void;
  savePosterConfig: () => Promise<void>;
  addRecommendedKeywordItem: (categoryId: string) => void;
  removeRecommendedKeywordItem: (categoryId: string) => void;
  updateRecommendedKeywordItem: (categoryId: string, field: 'sort_weight' | 'is_active', value: number | boolean) => void;
  saveRecommendedKeywordItems: () => Promise<void>;
  handleTopPromotionFormChange: <K extends keyof TopPromotionForm>(field: K, value: TopPromotionForm[K]) => void;
  saveTopPromotionConfig: () => Promise<void>;
  setQuickCreateParentId: (value: string | null) => void;
  setQuickCreateNames: (value: string) => void;
  submitQuickCreate: () => Promise<void>;
  togglePreviewProducts: (categoryId: string) => void;
  toggleCategorySelection: (categoryId: string, checked: boolean) => void;
  toggleSelectAllCurrentPage: (checked: boolean) => void;
  setBatchTargetParentId: (value: string | null) => void;
  handleBatchDelete: () => Promise<void>;
  handleBatchStatus: (nextStatus: CategoryStatus) => Promise<void>;
  handleBatchMoveParent: () => Promise<void>;
  setSelectedKeywordGroupId: (value: string | null) => void;
  toggleKeywordGroupExpanded: (keywordGroupId: string) => void;
  toggleKeywordParentExpanded: (keywordItemId: string) => void;
  openCreateKeywordGroupDialog: () => void;
  openEditKeywordGroupDialog: (group: KeywordGroupSummary) => void;
  closeKeywordGroupDialog: () => void;
  handleKeywordGroupFormChange: <K extends keyof KeywordGroupForm>(field: K, value: KeywordGroupForm[K]) => void;
  setProductSearchInput: (value: string) => void;
  setKeywordProductRelationScope: (value: 'LINKED' | 'UNLINKED') => void;
  handleKeywordProductFilterChange: <K extends keyof KeywordProductFilters>(field: K, value: KeywordProductFilters[K]) => void;
  searchGroupProducts: (page?: number) => Promise<void>;
  toggleKeywordProductSelection: (productId: string, checked: boolean) => void;
  toggleSelectAllKeywordProducts: (checked: boolean) => void;
  handleRemoveKeywordGroupProduct: (productId: string) => Promise<void>;
  handleBatchRemoveKeywordGroupProducts: () => Promise<void>;
  setKeywordProductPageSize: (value: string) => Promise<void>;
  submitKeywordGroupForm: () => Promise<void>;
  handleDeleteKeywordGroup: (keywordGroupId: string) => Promise<void>;
  openCreateKeywordItemDialog: (keywordGroupId: string, parentKeywordId?: string | null) => void;
  openEditKeywordItemDialog: (keywordGroupId: string, item: KeywordItemNode) => void;
  closeKeywordItemDialog: () => void;
  handleKeywordItemFormChange: <K extends keyof KeywordItemForm>(field: K, value: KeywordItemForm[K]) => void;
  submitKeywordItemForm: () => Promise<void>;
  handleDeleteKeywordItem: (keywordItemId: string) => Promise<void>;
  openBatchKeywordItemDialog: (keywordGroupId: string, parentKeywordId?: string | null, items?: KeywordItemNode[]) => void;
  closeBatchKeywordItemDialog: () => void;
  addBatchKeywordItemDraft: () => void;
  updateBatchKeywordItemDraft: (tempId: string, field: keyof BatchKeywordItemDraft, value: string | number | boolean | null) => void;
  removeBatchKeywordItemDraft: (tempId: string) => void;
  submitBatchKeywordItems: () => Promise<void>;
  openBatchKeywordDialog: (keywordGroupId?: string | null) => void;
  closeBatchKeywordDialog: () => void;
  toggleBatchKeywordItem: (keywordItemId: string, checked: boolean) => void;
  toggleBatchKeywordCategory: (categoryId: string, checked: boolean) => void;
  handleBatchKeywordFormChange: <K extends keyof BatchKeywordApplyForm>(field: K, value: BatchKeywordApplyForm[K]) => void;
  submitBatchKeywordApply: () => Promise<void>;
  setKeywordSearchInput: (value: string) => void;
}

const createDefaultDisplayConfig = (): CategoryDisplayConfig => ({
  showChildrenByDefault: false,
  allowChildrenCollapse: true,
  showBrandFilter: false,
  brandFilterCollapsedRows: 3,
});

const createDefaultFormData = (): FormFields => ({
  category_name: '',
  category_slug: '',
  parent_id: null,
  level: 1,
  image_url: '',
  banner_image_url: '',
  description: '',
  sort_weight: 0,
  status: 'ACTIVE',
  category_kind: 'MAIN',
  brand_keywords_text: '',
  price_coefficient: 1,
  category_display_config: createDefaultDisplayConfig(),
});

const createDefaultPosterForm = (): HomepagePosterConfig => ({
  category_id: '',
  items: [],
});

const createDefaultTopPromotionForm = (): TopPromotionForm => ({
  enabled: false,
  message: '',
  end_time: '',
  background_color: '#000000',
  text_color: '#ffffff',
});

const createDefaultKeywordGroupForm = (): KeywordGroupForm => ({
  keyword_group_id: null,
  name: '',
  slug: '',
  group_type: 'GENERAL',
  scene_key: '',
  scene_type: '',
  description: '',
  floor_title: '',
  floor_icon: '',
  floor_link: '',
  homepage_sort_weight: 0,
  show_on_homepage: false,
  sort_weight: 0,
  is_active: true,
  linked_products: [],
});

const createDefaultKeywordItemForm = (): KeywordItemForm => ({
  keyword_item_id: null,
  keyword_group_id: '',
  parent_keyword_id: null,
  keyword: '',
  sort_weight: 0,
  is_active: true,
});

const createBatchKeywordItemDraft = (input?: Partial<BatchKeywordItemDraft>): BatchKeywordItemDraft => ({
  temp_id: input?.temp_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  keyword_item_id: input?.keyword_item_id ?? null,
  keyword: input?.keyword ?? '',
  parent_keyword_id: input?.parent_keyword_id ?? null,
  sort_weight: input?.sort_weight ?? 0,
  is_active: input?.is_active ?? true,
});

const createDefaultBatchKeywordForm = (): BatchKeywordApplyForm => ({
  keyword_group_id: '',
  keyword_item_ids: [],
  category_ids: [],
  apply_to_homepage: false,
});

const createDefaultKeywordProductFilters = (): KeywordProductFilters => ({
  keyword: '',
  spu: '',
  min_price: '',
  max_price: '',
  scene_key: '',
  scene_type: '',
});

const parseBrandKeywordsText = (value: string) => value.split(/[\n,，]/).map(item => item.trim()).filter(Boolean);

const mapCategoryToForm = (item: CategoryItem): FormFields => ({
  category_name: item.category_name,
  category_slug: item.category_slug || '',
  parent_id: item.parent_id,
  level: item.level,
  image_url: item.image_url || '',
  banner_image_url: item.banner_image_url || '',
  description: item.description || '',
  sort_weight: item.sort_weight,
  status: item.status,
  category_kind: item.category_kind,
  brand_keywords_text: item.brand_keywords.join('\n'),
  price_coefficient: item.price_coefficient,
  category_display_config: item.category_display_config,
});

const flattenKeywordNodes = (nodes: KeywordItemNode[]): KeywordItemNode[] => {
  const result: KeywordItemNode[] = [];
  const walk = (items: KeywordItemNode[]) => {
    items.forEach(item => {
      result.push(item);
      if (item.children.length > 0) {
        walk(item.children);
      }
    });
  };
  walk(nodes);
  return result;
};

const mapTopPromotionConfigToForm = (config?: Partial<CategoryTopPromotionConfigValue> | null): TopPromotionForm => ({
  enabled: Boolean(config?.enabled),
  message: config?.message || '',
  end_time: config?.end_time || '',
  background_color: config?.background_color || '#000000',
  text_color: config?.text_color || '#ffffff',
});

const createDefaultRecommendedKeywordItem = (category: CategoryOption): RecommendedKeywordFormItem => ({
  category_id: category.category_id,
  category_name: category.category_name,
  category_slug: null,
  sort_weight: 0,
  is_active: true,
});

const buildLinkedProductSearchState = (
  linkedProducts: KeywordGroupBoundProductSummaryCompat[],
  page: number,
  pageSize: number,
  filters: KeywordProductFilters,
): SearchKeywordGroupProductsResultCompat => {
  const normalizedKeyword = filters.keyword.trim().toLowerCase();
  const normalizedSpu = filters.spu.trim().toLowerCase();
  const minPrice = filters.min_price.trim() === '' ? null : Number(filters.min_price);
  const maxPrice = filters.max_price.trim() === '' ? null : Number(filters.max_price);
  const filtered = linkedProducts.filter(product => {
    const keywordMatched = !normalizedKeyword || [product.product_name, product.product_slug]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword);
    const spuMatched = !normalizedSpu || (product.sku_code ?? '').toLowerCase().includes(normalizedSpu);
    const priceValue = product.price ?? null;
    const minMatched = minPrice === null || !Number.isFinite(minPrice) || (priceValue !== null && priceValue >= minPrice);
    const maxMatched = maxPrice === null || !Number.isFinite(maxPrice) || (priceValue !== null && priceValue <= maxPrice);
    return keywordMatched && spuMatched && minMatched && maxMatched;
  });
  const startIndex = Math.max(0, (page - 1) * pageSize);
  const paged = filtered.slice(startIndex, startIndex + pageSize);
  return {
    list: paged,
    total: filtered.length,
    page,
    page_size: pageSize,
  };
};

const buildKeywordProductQuerySnapshot = (
  keywordGroupId: string | null,
  relationScope: 'LINKED' | 'UNLINKED',
  filters: KeywordProductFilters,
  page: number,
  pageSize: number,
): KeywordProductQuerySnapshot => ({
  keyword_group_id: keywordGroupId,
  relationScope,
  filters: {
    ...filters,
  },
  page,
  page_size: pageSize,
});

export const useCategoryManagement = (): { state: CategoryManagementState; handlers: CategoryManagementHandlers } => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [list, setList] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [pageSize, setPageSize] = useState(50); // 分类列表默认每页 50 条
  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') || '');
  const [activeKeyword, setActiveKeyword] = useState(searchParams.get('keyword') || '');
  const [status, setStatus] = useState<'ALL' | CategoryStatus>((searchParams.get('status') as 'ALL' | CategoryStatus) || 'ALL');
  const [levelFilter, setLevelFilter] = useState<'ALL' | '1' | '2'>((searchParams.get('level') as 'ALL' | '1' | '2') || 'ALL');
  const [categoryId] = useState<string | null>(searchParams.get('category_id'));
  const [inlineNameEditingId, setInlineNameEditingId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState('');
  const [isInlineNameSaving, setIsInlineNameSaving] = useState(false);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [coefficientInputs, setCoefficientInputs] = useState<Record<string, string>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormFields>(createDefaultFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteItem, setDeleteItem] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [parentOptions, setParentOptions] = useState<CategoryOption[]>([]);
  const [posterConfigs, setPosterConfigs] = useState<HomepagePosterConfig[]>([]);
  const [recommendedKeywordItems, setRecommendedKeywordItems] = useState<RecommendedKeywordFormItem[]>([]);
  const [recommendedKeywordDrafts, setRecommendedKeywordDrafts] = useState<RecommendedKeywordFormItem[]>([]);
  const [isSavingRecommendedKeywords, setIsSavingRecommendedKeywords] = useState(false);
  const [topPromotionForm, setTopPromotionForm] = useState<TopPromotionForm>(createDefaultTopPromotionForm());
  const [isSavingTopPromotion, setIsSavingTopPromotion] = useState(false);
  const [isPosterDrawerOpen, setIsPosterDrawerOpen] = useState(false);
  const [posterForm, setPosterForm] = useState<HomepagePosterConfig>(createDefaultPosterForm());
  const [isSavingPoster, setIsSavingPoster] = useState(false);
  const [quickCreateParentId, setQuickCreateParentId] = useState<string | null>(null);
  const [quickCreateNames, setQuickCreateNames] = useState('');
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [expandedPreviewProducts, setExpandedPreviewProducts] = useState<Record<string, boolean>>({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [batchTargetParentId, setBatchTargetParentId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroupSummaryCompat[]>([]);
  const [keywordCategoryOptions, setKeywordCategoryOptions] = useState<CategoryOption[]>([]);
  const [selectedKeywordGroupId, setSelectedKeywordGroupId] = useState<string | null>(null);
  const [expandedKeywordGroups, setExpandedKeywordGroups] = useState<Record<string, boolean>>({});
  const [expandedKeywordParents, setExpandedKeywordParents] = useState<Record<string, boolean>>({});
  const [isKeywordGroupDialogOpen, setIsKeywordGroupDialogOpen] = useState(false);
  const [keywordGroupForm, setKeywordGroupForm] = useState<KeywordGroupForm>(createDefaultKeywordGroupForm());
  const [isSavingKeywordGroup, setIsSavingKeywordGroup] = useState(false);
  const [productSearchInput, setProductSearchInput] = useState('');
  const [keywordProductRelationScope, setKeywordProductRelationScope] = useState<'LINKED' | 'UNLINKED'>('LINKED');
  const [keywordProductFilters, setKeywordProductFilters] = useState<KeywordProductFilters>(createDefaultKeywordProductFilters());
  const [productSearchState, setProductSearchState] = useState<KeywordProductSearchState>({ list: [], total: 0, page: 1, page_size: 50 });
  const [isProductSearchLoading, setIsProductSearchLoading] = useState(false);
  const [selectedKeywordProductIds, setSelectedKeywordProductIds] = useState<string[]>([]);
  const [activeKeywordProductQuery, setActiveKeywordProductQuery] = useState<KeywordProductQuerySnapshot | null>(null);
  const [isKeywordItemDialogOpen, setIsKeywordItemDialogOpen] = useState(false);
  const [keywordItemForm, setKeywordItemForm] = useState<KeywordItemForm>(createDefaultKeywordItemForm());
  const [isSavingKeywordItem, setIsSavingKeywordItem] = useState(false);
  const [isBatchKeywordItemDialogOpen, setIsBatchKeywordItemDialogOpen] = useState(false);
  const [batchKeywordItemGroupId, setBatchKeywordItemGroupId] = useState('');
  const [batchKeywordItemParentId, setBatchKeywordItemParentId] = useState<string | null>(null);
  const [batchKeywordItemDrafts, setBatchKeywordItemDrafts] = useState<BatchKeywordItemDraft[]>([createBatchKeywordItemDraft()]);
  const [isSavingBatchKeywordItems, setIsSavingBatchKeywordItems] = useState(false);
  const [deletingKeywordGroupId, setDeletingKeywordGroupId] = useState<string | null>(null);
  const [deletingKeywordItemId, setDeletingKeywordItemId] = useState<string | null>(null);
  const [batchKeywordApplyForm, setBatchKeywordApplyForm] = useState<BatchKeywordApplyForm>(createDefaultBatchKeywordForm());
  const [isBatchKeywordDialogOpen, setIsBatchKeywordDialogOpen] = useState(false);
  const [isApplyingKeywords, setIsApplyingKeywords] = useState(false);
  const [keywordSearchInput, setKeywordSearchInput] = useState('');
  const [batchFeedback, setBatchFeedback] = useState<BatchActionFeedback | null>(null);
  const level1DragFromIndex = useRef<number | null>(null);
  const level1DragOverIndex = useRef<number | null>(null);
  const isSavingLevel1Sort = useRef(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageSizeChange = (next: number) => {
    const size = Math.max(1, Math.min(200, Math.floor(Number(next) || 50)));
    setPageSize(size);
    setPage(1);
  };

  const loadData = useCallback(async (
    nextPage = page,
    nextKeyword = activeKeyword,
    nextStatus = status,
    nextLevel = levelFilter,
  ) => {
    setIsLoading(true);
    try {
      const input = {
        page: nextPage,
        page_size: pageSize,
        keyword: nextKeyword || undefined,
        status: nextStatus === 'ALL' ? undefined : nextStatus,
        level: nextLevel === 'ALL' ? undefined : Number(nextLevel) as CategoryLevel,
      };
      const result = await getCategoryList(input) as unknown as GetCategoryListResult;
      setList(result.list);
      setTotal(result.total);
      setParentOptions(result.parent_options);
      setPosterConfigs(result.poster_configs);
      const recommendedItems = ((result.recommended_keyword_items ?? []) as Array<CategoryRecommendedKeywordItem & RecommendedKeywordFormItem>).map(item => ({
        category_id: item.category_id,
        category_name: item.category_name,
        category_slug: item.category_slug,
        sort_weight: item.sort_weight,
        is_active: item.is_active,
      }));
      setRecommendedKeywordItems(recommendedItems);
      setRecommendedKeywordDrafts(recommendedItems);
      setTopPromotionForm(mapTopPromotionConfigToForm(result.top_promotion_config));
      setKeywordGroups(result.keyword_operation_data.group_summaries);
      setKeywordCategoryOptions(result.keyword_operation_data.category_options);
      setWeightInputs(Object.fromEntries(result.list.map(item => [item.category_id, String(item.sort_weight)])));
      setCoefficientInputs(Object.fromEntries(result.list.map(item => [
        item.category_id,
        item.price_coefficient == null ? '' : String(item.price_coefficient),
      ])));
      setExpandedKeywordGroups(prev => {
        const next = { ...prev };
        result.keyword_operation_data.group_summaries.forEach(group => {
          if (next[group.keyword_group_id] === undefined) next[group.keyword_group_id] = true;
        });
        return next;
      });
      if (!selectedKeywordGroupId && result.keyword_operation_data.group_summaries.length > 0) {
        setSelectedKeywordGroupId(result.keyword_operation_data.group_summaries[0].keyword_group_id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeKeyword, levelFilter, page, pageSize, selectedKeywordGroupId, status]);

  useEffect(() => {
    loadData(page, activeKeyword, status, levelFilter);
  }, [page, activeKeyword, status, levelFilter, loadData]);

  const selectedKeywordGroup = useMemo(() => {
    return keywordGroups.find(group => group.keyword_group_id === selectedKeywordGroupId) || keywordGroups[0] || null;
  }, [keywordGroups, selectedKeywordGroupId]);

  const runKeywordProductQuery = useCallback(async (snapshot: KeywordProductQuerySnapshot) => {
    setIsProductSearchLoading(true);
    try {
      if (!snapshot.keyword_group_id) {
        setProductSearchState({
          list: [],
          total: 0,
          page: snapshot.page,
          page_size: snapshot.page_size,
        });
        return;
      }

      const result = await searchKeywordGroupProducts({
        keyword_group_id: snapshot.keyword_group_id || undefined,
        relation_scope: snapshot.relationScope,
        keyword: snapshot.filters.keyword.trim() || undefined,
        spu: snapshot.filters.spu.trim() || undefined,
        min_price: snapshot.filters.min_price.trim() === '' ? undefined : Number(snapshot.filters.min_price),
        max_price: snapshot.filters.max_price.trim() === '' ? undefined : Number(snapshot.filters.max_price),
        page: snapshot.page,
        page_size: snapshot.page_size,
      }) as SearchKeywordGroupProductsResultCompat;
      setProductSearchState(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProductSearchLoading(false);
    }
  }, [keywordGroups]);

  const filteredKeywordGroups = useMemo(() => {
    const keyword = keywordSearchInput.trim().toLowerCase();
    if (!keyword) return keywordGroups;
    return keywordGroups.filter(group => {
      if (group.name.toLowerCase().includes(keyword)) return true;
      return flattenKeywordNodes(group.keywords).some(item => item.keyword.toLowerCase().includes(keyword));
    });
  }, [keywordGroups, keywordSearchInput]);

  const openCreateDrawer = (level: CategoryLevel = 1, parentId: string | null = null) => {
    setEditingId(null);
    setFormData({
      ...createDefaultFormData(),
      level,
      parent_id: level === 2 ? parentId : null,
      price_coefficient: level === 1 ? 1 : null,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormData(createDefaultFormData());
  };

  const handleFormChange = <K extends keyof FormFields>(field: K, value: FormFields[K]) => {
    setFormData(prev => {
      if (field === 'level') {
        const nextLevel = value as CategoryLevel;
        return {
          ...prev,
          level: nextLevel,
          parent_id: nextLevel === 1 ? null : prev.parent_id,
          category_kind: nextLevel === 2 ? 'MAIN' : prev.category_kind,
          banner_image_url: nextLevel === 2 ? prev.banner_image_url : prev.banner_image_url,
        };
      }
      if (field === 'category_kind') {
        const nextKind = value as 'MAIN' | 'BRAND';
        return {
          ...prev,
          category_kind: nextKind,
          banner_image_url: nextKind === 'BRAND' ? '' : prev.banner_image_url,
          parent_id: nextKind === 'BRAND' ? null : prev.parent_id,
        };
      }
      if (field === 'category_display_config') {
        return {
          ...prev,
          category_display_config: value as CategoryDisplayConfig,
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const submitForm = async () => {
    if (!formData.category_name.trim()) {
      toast.error('请填写分类名称');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCategoryInput = {
        category_name: formData.category_name,
        category_slug: formData.category_slug,
        parent_id: formData.parent_id,
        level: formData.level,
        image_url: formData.image_url,
        banner_image_url: formData.category_kind === 'BRAND' ? null : formData.banner_image_url,
        description: formData.description,
        sort_weight: formData.sort_weight,
        status: formData.status,
        category_kind: formData.level === 1 ? formData.category_kind : 'MAIN',
        brand_keywords: parseBrandKeywordsText(formData.brand_keywords_text),
        price_coefficient: formData.price_coefficient,
        category_display_config: formData.category_display_config,
      };

      if (editingId) {
        await updateCategory({ ...payload, category_id: editingId } as UpdateCategoryInput);
        toast.success('分类已更新');
      } else {
        await createCategory(payload);
        toast.success('分类已创建');
      }
      closeDrawer();
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setActiveKeyword(searchInput.trim());
  };

  const handleTabChange = (value: 'ALL' | CategoryStatus) => {
    setPage(1);
    setStatus(value);
  };

  const handleLevelChange = (value: 'ALL' | '1' | '2') => {
    setPage(1);
    setLevelFilter(value);
  };

  const handleInlineStatusChange = async (item: CategoryItem, checked: boolean) => {
    try {
      await updateCategoryStatus({
        category_id: item.category_id,
        status: checked ? 'ACTIVE' : 'INACTIVE',
      });
      toast.success('分类状态已更新');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const startInlineNameEdit = (item: CategoryItem) => {
    setInlineNameEditingId(item.category_id);
    setInlineNameValue(item.category_name);
  };

  const changeInlineNameValue = (value: string) => {
    setInlineNameValue(value);
  };

  const cancelInlineNameEdit = () => {
    if (isInlineNameSaving) return;
    setInlineNameEditingId(null);
    setInlineNameValue('');
  };

  const submitInlineNameEdit = async (item: CategoryItem) => {
    if (isInlineNameSaving) return;
    const nextName = inlineNameValue.trim();
    if (!inlineNameEditingId || inlineNameEditingId !== item.category_id) return;
    if (!nextName) {
      toast.error('分类名称不能为空');
      setInlineNameValue(item.category_name);
      return;
    }
    if (nextName === item.category_name) {
      cancelInlineNameEdit();
      return;
    }

    setIsInlineNameSaving(true);
    try {
      await updateCategory({
        category_id: item.category_id,
        category_name: nextName,
        category_slug: item.category_slug || '',
        parent_id: item.parent_id,
        level: item.level,
        image_url: item.image_url || '',
        banner_image_url: item.banner_image_url || '',
        description: item.description || '',
        sort_weight: item.sort_weight,
        status: item.status,
        category_kind: item.category_kind,
        brand_keywords: item.brand_keywords || [],
        price_coefficient: item.price_coefficient ?? null,
        category_display_config: item.category_display_config || createDefaultDisplayConfig(),
      });
      setInlineNameEditingId(null);
      setInlineNameValue('');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsInlineNameSaving(false);
    }
  };

  const handleInlineWeightChange = (categoryId: string, value: string) => {
    setWeightInputs(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleInlineWeightBlur = async (item: CategoryItem) => {
    const nextValue = Number(weightInputs[item.category_id]);
    if (!Number.isFinite(nextValue) || nextValue === item.sort_weight) return;
    try {
      await updateCategorySortWeight({ category_id: item.category_id, sort_weight: nextValue });
      toast.success('排序权重已更新');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setWeightInputs(prev => ({ ...prev, [item.category_id]: String(item.sort_weight) }));
    }
  };

  const handleInlineCoefficientChange = (categoryId: string, value: string) => {
    setCoefficientInputs(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleInlineCoefficientBlur = async (item: CategoryItem) => {
    if (!canEditCategoryPriceCoefficient({ level: item.level, parentId: item.parent_id, name: item.category_name })) {
      setCoefficientInputs(prev => ({
        ...prev,
        [item.category_id]: item.price_coefficient == null ? '' : String(item.price_coefficient),
      }));
      return;
    }
    const raw = (coefficientInputs[item.category_id] ?? '').trim();
    const nextValue = raw === '' ? null : Number(raw);
    const prevValue = item.price_coefficient;
    if (raw !== '' && (!Number.isFinite(nextValue) || (nextValue as number) <= 0)) {
      toast.error('售价系数必须大于 0');
      setCoefficientInputs(prev => ({
        ...prev,
        [item.category_id]: prevValue == null ? '' : String(prevValue),
      }));
      return;
    }
    if (nextValue === prevValue || (nextValue === null && prevValue === null)) return;
    if (nextValue === null && item.level === 1 && prevValue === 1) return;
    try {
      await updateCategoryPriceCoefficient({
        category_id: item.category_id,
        price_coefficient: nextValue,
      });
      toast.success('售价系数已更新');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setCoefficientInputs(prev => ({
        ...prev,
        [item.category_id]: prevValue == null ? '' : String(prevValue),
      }));
    }
  };

  const onLevel1DragStart = (index: number) => {
    const item = list[index];
    if (!item || item.level !== 1) return;
    level1DragFromIndex.current = index;
  };

  const onLevel1DragEnter = (index: number) => {
    const item = list[index];
    if (!item || item.level !== 1) return;
    level1DragOverIndex.current = index;
  };

  const onLevel1DragEnd = async () => {
    const fromIndex = level1DragFromIndex.current;
    const toIndex = level1DragOverIndex.current;
    level1DragFromIndex.current = null;
    level1DragOverIndex.current = null;

    if (
      fromIndex === null ||
      toIndex === null ||
      fromIndex === toIndex ||
      isSavingLevel1Sort.current
    ) {
      return;
    }

    const fromItem = list[fromIndex];
    const toItem = list[toIndex];
    if (!fromItem || !toItem || fromItem.level !== 1 || toItem.level !== 1) return;

    const level1Items = list.filter(item => item.level === 1);
    const otherItems = list.filter(item => item.level !== 1);
    const fromL1 = level1Items.findIndex(item => item.category_id === fromItem.category_id);
    const toL1 = level1Items.findIndex(item => item.category_id === toItem.category_id);
    if (fromL1 < 0 || toL1 < 0 || fromL1 === toL1) return;

    const nextLevel1 = [...level1Items];
    const [moved] = nextLevel1.splice(fromL1, 1);
    nextLevel1.splice(toL1, 0, moved);

    const baseWeight = Math.max(nextLevel1.length * 10, 10);
    const updates = nextLevel1.map((item, index) => ({
      category_id: item.category_id,
      sort_weight: baseWeight - index * 10,
    }));

    const nextList = [
      ...nextLevel1.map((item, index) => ({
        ...item,
        sort_weight: updates[index].sort_weight,
      })),
      ...otherItems,
    ];
    setList(nextList);
    setWeightInputs(prev => ({
      ...prev,
      ...Object.fromEntries(updates.map(item => [item.category_id, String(item.sort_weight)])),
    }));

    isSavingLevel1Sort.current = true;
    try {
      await batchUpdateCategorySortWeight({ updates });
      toast.success('一级分类顺序已保存');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      await loadData(page, activeKeyword, status, levelFilter);
    } finally {
      isSavingLevel1Sort.current = false;
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteCategory({ category_id: deleteItem.category_id });
      toast.success('分类已删除');
      setDeleteItem(null);
      setSelectedCategoryIds(prev => prev.filter(id => id !== deleteItem.category_id));
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const navigateToDetail = (targetCategoryId: string) => {
    const current = list.find(item => item.category_id === targetCategoryId);
    if (!current) return;
    setEditingId(targetCategoryId);
    setFormData(mapCategoryToForm(current));
    setIsDrawerOpen(true);
  };

  const openPosterDrawer = (item: CategoryItem) => {
    const existing = posterConfigs.find(config => config.category_id === item.category_id);
    setPosterForm(existing || { category_id: item.category_id, items: [] });
    setIsPosterDrawerOpen(true);
  };

  const closePosterDrawer = () => {
    setIsPosterDrawerOpen(false);
    setPosterForm(createDefaultPosterForm());
  };

  const addRecommendedKeywordItem = (categoryId: string) => {
    const category = parentOptions.find(item => item.category_id === categoryId);
    if (!category) return;

    setRecommendedKeywordDrafts(prev => {
      if (prev.some(item => item.category_id === categoryId)) {
        return prev;
      }

      const matched = recommendedKeywordItems.find(item => item.category_id === categoryId);
      return [
        ...prev,
        matched || {
          ...createDefaultRecommendedKeywordItem(category),
          category_slug: list.find(item => item.category_id === categoryId)?.category_slug || null,
          category_name: list.find(item => item.category_id === categoryId)?.category_name || category.category_name,
        },
      ];
    });
  };

  const removeRecommendedKeywordItem = (categoryId: string) => {
    setRecommendedKeywordDrafts(prev => prev.filter(item => item.category_id !== categoryId));
  };

  const updateRecommendedKeywordItem = (categoryId: string, field: 'sort_weight' | 'is_active', value: number | boolean) => {
    setRecommendedKeywordDrafts(prev => prev.map(item => item.category_id === categoryId ? { ...item, [field]: value } : item));
  };

  const saveRecommendedKeywordItems = async () => {
    if (recommendedKeywordDrafts.length === 0) {
      toast.error('请至少选择一个一级分类');
      return;
    }

    setIsSavingRecommendedKeywords(true);
    try {
      const payload: SaveCategoryRecommendedKeywordsInput = {
        items: recommendedKeywordDrafts.map(item => ({
          category_id: item.category_id,
          sort_weight: item.sort_weight,
          is_active: item.is_active,
        })),
      };
      await saveCategoryRecommendedKeywords(payload);
      toast.success('分类页热门搜索已保存');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingRecommendedKeywords(false);
    }
  };

  const handleTopPromotionFormChange = <K extends keyof TopPromotionForm>(field: K, value: TopPromotionForm[K]) => {
    setTopPromotionForm(prev => ({ ...prev, [field]: value }));
  };

  const saveTopPromotionConfig = async () => {
    setIsSavingTopPromotion(true);
    try {
      const payload = {
        enabled: topPromotionForm.enabled,
        message: topPromotionForm.message,
        end_time: topPromotionForm.end_time.trim() || null,
        background_color: topPromotionForm.background_color,
        text_color: topPromotionForm.text_color,
      };
      await saveCategoryTopPromotionConfig(payload);
      toast.success('顶部促销倒计时配置已保存');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingTopPromotion(false);
    }
  };

  const addPosterItem = () => {
    setPosterForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `poster-${Date.now()}`,
          title: '',
          image_url: '',
          link: null,
          sort_weight: prev.items.length + 1,
          is_active: true,
          aspect_preset: 'CROSS_BORDER_HERO',
        },
      ],
    }));
  };

  const removePosterItem = (posterId: string) => {
    setPosterForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== posterId),
    }));
  };

  const updatePosterItem = (posterId: string, field: keyof HomepagePosterItem, value: string | number | boolean) => {
    setPosterForm(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === posterId ? { ...item, [field]: value } : item),
    }));
  };

  const savePosterConfig = async () => {
    if (!posterForm.category_id) {
      toast.error('未选择可配置海报的一级分类');
      return;
    }
    setIsSavingPoster(true);
    try {
      const payload: SaveHomepagePosterConfigInput = {
        category_id: posterForm.category_id,
        items: posterForm.items.map(item => ({
          ...item,
          aspect_preset: item.aspect_preset || 'CROSS_BORDER_HERO',
        })),
      };
      await saveHomepagePosterConfig(payload);
      toast.success('目录海报配置已保存');
      closePosterDrawer();
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingPoster(false);
    }
  };

  const submitQuickCreate = async () => {
    if (!quickCreateParentId) {
      toast.error('请先选择一级分类');
      return;
    }

    const categoryNames = quickCreateNames
      .split('\n')
      .map(name => name.trim())
      .filter(Boolean);

    if (categoryNames.length === 0) {
      toast.error('请至少输入一个子类名称');
      return;
    }

    setIsQuickCreating(true);
    try {
      const payload: BatchCreateSubcategoriesInput = {
        parent_id: quickCreateParentId,
        category_names: categoryNames,
        status: 'ACTIVE',
      };
      const result = await batchCreateSubcategories(payload);
      toast.success(`已新增 ${result.created_count} 个子类`);
      setQuickCreateNames('');
      setLevelFilter('2');
      setPage(1);
      await loadData(1, activeKeyword, status, '2');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsQuickCreating(false);
    }
  };

  const togglePreviewProducts = (categoryId: string) => {
    setExpandedPreviewProducts(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleCategorySelection = (targetCategoryId: string, checked: boolean) => {
    setSelectedCategoryIds(prev => checked
      ? Array.from(new Set([...prev, targetCategoryId]))
      : prev.filter(id => id !== targetCategoryId));
  };

  const toggleSelectAllCurrentPage = (checked: boolean) => {
    setSelectedCategoryIds(checked ? list.map(item => item.category_id) : []);
  };

  const handleBatchDelete = async () => {
    if (selectedCategoryIds.length === 0) {
      toast.error('请先选择要删除的分类');
      return;
    }
    setIsBatchProcessing(true);
    try {
      const result = await batchDeleteCategories({ category_ids: selectedCategoryIds });
      setBatchFeedback({ ...result, failed_messages: [] });
      toast.success(`批量删除完成：成功 ${result.success_count} 条`);
      setSelectedCategoryIds([]);
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchStatus = async (nextStatus: CategoryStatus) => {
    if (selectedCategoryIds.length === 0) {
      toast.error('请先选择分类');
      return;
    }
    setIsBatchProcessing(true);
    try {
      const result = await batchUpdateCategoryStatus({ category_ids: selectedCategoryIds, status: nextStatus });
      setBatchFeedback({ ...result, failed_messages: [] });
      toast.success(`批量${nextStatus === 'ACTIVE' ? '启用' : '停用'}已完成`);
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchMoveParent = async () => {
    if (selectedCategoryIds.length === 0) {
      toast.error('请先选择要移动的分类');
      return;
    }
    setIsBatchProcessing(true);
    try {
      const result = await batchMoveCategoryParent({
        category_ids: selectedCategoryIds,
        target_parent_id: batchTargetParentId,
      });
      setBatchFeedback({ ...result, failed_messages: [] });
      toast.success(`批量移动完成：成功 ${result.success_count} 条`);
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const openCreateKeywordGroupDialog = () => {
    setKeywordGroupForm(createDefaultKeywordGroupForm());
    setProductSearchInput('');
    setKeywordProductRelationScope('LINKED');
    setKeywordProductFilters(createDefaultKeywordProductFilters());
    setProductSearchState({ list: [], total: 0, page: 1, page_size: 50 });
    setSelectedKeywordProductIds([]);
    setActiveKeywordProductQuery(null);
    setIsKeywordGroupDialogOpen(true);
  };

  const openEditKeywordGroupDialog = (group: KeywordGroupSummaryCompat) => {
    const keywordGroup = group as KeywordGroupSummaryCompat;
    setKeywordGroupForm({
      keyword_group_id: group.keyword_group_id,
      name: group.name,
      slug: group.slug || '',
      group_type: group.group_type,
      scene_key: keywordGroup.scene_key || '',
      scene_type: keywordGroup.scene_type || '',
      description: group.description || '',
      floor_title: keywordGroup.floor_title || '',
      floor_icon: keywordGroup.floor_icon || '',
      floor_link: keywordGroup.floor_link || '',
      homepage_sort_weight: keywordGroup.homepage_sort_weight ?? 0,
      show_on_homepage: keywordGroup.show_on_homepage ?? false,
      sort_weight: group.sort_weight,
      is_active: group.is_active,
      linked_products: (group.linked_products ?? []).map(item => ({
        product_id: item.product_id,
        sort_weight: item.sort_weight,
      })),
    });
    setProductSearchInput('');
    setKeywordProductRelationScope('LINKED');
    setKeywordProductFilters(createDefaultKeywordProductFilters());
    setProductSearchState({ list: [], total: 0, page: 1, page_size: 50 });
    setSelectedKeywordProductIds([]);
    const initialSnapshot = buildKeywordProductQuerySnapshot(
      group.keyword_group_id,
      'LINKED',
      createDefaultKeywordProductFilters(),
      1,
      12,
    );
    setActiveKeywordProductQuery(initialSnapshot);
    setIsKeywordGroupDialogOpen(true);
    void runKeywordProductQuery(initialSnapshot);
  };

  const closeKeywordGroupDialog = () => {
    setIsKeywordGroupDialogOpen(false);
    setKeywordGroupForm(createDefaultKeywordGroupForm());
    setProductSearchInput('');
    setKeywordProductRelationScope('LINKED');
    setKeywordProductFilters(createDefaultKeywordProductFilters());
    setProductSearchState({ list: [], total: 0, page: 1, page_size: 50 });
    setSelectedKeywordProductIds([]);
    setActiveKeywordProductQuery(null);
  };

  const handleKeywordGroupFormChange = <K extends keyof KeywordGroupForm>(field: K, value: KeywordGroupForm[K]) => {
    setKeywordGroupForm(prev => ({ ...prev, [field]: value }));
  };

  const handleKeywordProductFilterChange = <K extends keyof KeywordProductFilters>(field: K, value: KeywordProductFilters[K]) => {
    setKeywordProductFilters(prev => ({ ...prev, [field]: value }));
  };

  const searchGroupProducts = async (targetPage = 1) => {
    const snapshot = buildKeywordProductQuerySnapshot(
      keywordGroupForm.keyword_group_id,
      keywordProductRelationScope,
      keywordProductFilters,
      targetPage,
      productSearchState.page_size,
    );
    setActiveKeywordProductQuery(snapshot);
    setSelectedKeywordProductIds([]);
    await runKeywordProductQuery(snapshot);
  };

  const toggleKeywordProductSelection = (productId: string, checked: boolean) => {
    setSelectedKeywordProductIds(prev => checked
      ? Array.from(new Set([...prev, productId]))
      : prev.filter(id => id !== productId));
  };

  const toggleSelectAllKeywordProducts = (checked: boolean) => {
    setSelectedKeywordProductIds(checked ? productSearchState.list.map(item => item.product_id) : []);
  };

  const refreshKeywordProductTable = useCallback(async () => {
    if (!activeKeywordProductQuery) return;
    await runKeywordProductQuery(activeKeywordProductQuery);
  }, [activeKeywordProductQuery, runKeywordProductQuery]);

  const handleRemoveKeywordGroupProduct = async (productId: string) => {
    if (!keywordGroupForm.keyword_group_id) {
      toast.error('请先保存关键词分组基础信息');
      return;
    }
    try {
      await removeKeywordGroupProductLink({
        keyword_group_id: keywordGroupForm.keyword_group_id,
        product_id: productId,
      });
      toast.success('商品关联已取消');
      setSelectedKeywordProductIds(prev => prev.filter(id => id !== productId));
      await loadData(page, activeKeyword, status, levelFilter);
      await refreshKeywordProductTable();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleBatchRemoveKeywordGroupProducts = async () => {
    if (!keywordGroupForm.keyword_group_id) {
      toast.error('请先保存关键词分组基础信息');
      return;
    }
    if (selectedKeywordProductIds.length === 0) {
      toast.error('请先选择要取消关联的商品');
      return;
    }
    try {
      const result = await batchRemoveKeywordGroupProductLinks({
        keyword_group_id: keywordGroupForm.keyword_group_id,
        product_ids: selectedKeywordProductIds,
      });
      toast.success(`已取消 ${result.removed_count} 个商品关联`);
      setSelectedKeywordProductIds([]);
      await loadData(page, activeKeyword, status, levelFilter);
      await refreshKeywordProductTable();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const setKeywordProductPageSize = async (value: string) => {
    const nextPageSize = Math.max(1, Math.min(200, Math.floor(Number(value) || 50)));
    const snapshot = buildKeywordProductQuerySnapshot(
      keywordGroupForm.keyword_group_id,
      keywordProductRelationScope,
      keywordProductFilters,
      1,
      nextPageSize,
    );
    setActiveKeywordProductQuery(snapshot);
    setSelectedKeywordProductIds([]);
    await runKeywordProductQuery(snapshot);
  };

  const submitKeywordGroupForm = async () => {
    if (!keywordGroupForm.name.trim()) {
      toast.error('请填写分组名称');
      return;
    }
    setIsSavingKeywordGroup(true);
    try {
      const payload = {
        ...keywordGroupForm,
        name: keywordGroupForm.name.trim(),
        slug: keywordGroupForm.slug.trim(),
        scene_key: keywordGroupForm.scene_key.trim(),
        scene_type: keywordGroupForm.scene_type.trim(),
        description: keywordGroupForm.description.trim(),
        floor_title: keywordGroupForm.floor_title.trim(),
        floor_icon: keywordGroupForm.floor_icon.trim(),
        floor_link: keywordGroupForm.floor_link.trim(),
        linked_products: keywordGroupForm.linked_products,
      };
      if (keywordGroupForm.keyword_group_id) {
        await updateKeywordGroup(payload as UpdateKeywordGroupInput);
        toast.success('关键词分组已更新');
      } else {
        await createKeywordGroup(payload as CreateKeywordGroupInput);
        toast.success('关键词分组已创建');
      }
      closeKeywordGroupDialog();
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingKeywordGroup(false);
    }
  };

  const handleDeleteKeywordGroup = async (keywordGroupId: string) => {
    setDeletingKeywordGroupId(keywordGroupId);
    try {
      await deleteKeywordGroup({ keyword_group_id: keywordGroupId });
      toast.success('关键词分组已删除');
      if (selectedKeywordGroupId === keywordGroupId) {
        setSelectedKeywordGroupId(null);
      }
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setDeletingKeywordGroupId(null);
    }
  };

  const openCreateKeywordItemDialog = (keywordGroupId: string, parentKeywordId: string | null = null) => {
    setKeywordItemForm({
      ...createDefaultKeywordItemForm(),
      keyword_group_id: keywordGroupId,
      parent_keyword_id: parentKeywordId,
    });
    setIsKeywordItemDialogOpen(true);
  };

  const openEditKeywordItemDialog = (keywordGroupId: string, item: KeywordItemNode) => {
    setKeywordItemForm({
      keyword_item_id: item.keyword_item_id,
      keyword_group_id: keywordGroupId,
      parent_keyword_id: item.parent_keyword_id,
      keyword: item.keyword,
      sort_weight: item.sort_weight,
      is_active: item.is_active,
    });
    setIsKeywordItemDialogOpen(true);
  };

  const closeKeywordItemDialog = () => {
    setIsKeywordItemDialogOpen(false);
    setKeywordItemForm(createDefaultKeywordItemForm());
  };

  const handleKeywordItemFormChange = <K extends keyof KeywordItemForm>(field: K, value: KeywordItemForm[K]) => {
    setKeywordItemForm(prev => ({ ...prev, [field]: value }));
  };

  const submitKeywordItemForm = async () => {
    if (!keywordItemForm.keyword_group_id) {
      toast.error('请先选择关键词分组');
      return;
    }
    if (!keywordItemForm.keyword.trim()) {
      toast.error('请填写关键词');
      return;
    }
    setIsSavingKeywordItem(true);
    try {
      if (keywordItemForm.keyword_item_id) {
        await updateKeywordItem({
          keyword_item_id: keywordItemForm.keyword_item_id,
          keyword: keywordItemForm.keyword,
          parent_keyword_id: keywordItemForm.parent_keyword_id,
          sort_weight: keywordItemForm.sort_weight,
          is_active: keywordItemForm.is_active,
        } as UpdateKeywordItemInput);
        toast.success('关键词已更新');
      } else {
        await createKeywordItem(keywordItemForm as CreateKeywordItemInput);
        toast.success('关键词已创建');
      }
      closeKeywordItemDialog();
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingKeywordItem(false);
    }
  };

  const handleDeleteKeywordItem = async (keywordItemId: string) => {
    setDeletingKeywordItemId(keywordItemId);
    try {
      await deleteKeywordItem({ keyword_item_id: keywordItemId });
      toast.success('关键词已删除');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setDeletingKeywordItemId(null);
    }
  };

  const openBatchKeywordItemDialog = (keywordGroupId: string, parentKeywordId: string | null = null, items: KeywordItemNode[] = []) => {
    setBatchKeywordItemGroupId(keywordGroupId);
    setBatchKeywordItemParentId(parentKeywordId);
    setBatchKeywordItemDrafts(
      items.length > 0
        ? items.map(item => createBatchKeywordItemDraft({
            keyword_item_id: item.keyword_item_id,
            keyword: item.keyword,
            parent_keyword_id: item.parent_keyword_id,
            sort_weight: item.sort_weight,
            is_active: item.is_active,
          }))
        : [createBatchKeywordItemDraft({ parent_keyword_id: parentKeywordId })],
    );
    setIsBatchKeywordItemDialogOpen(true);
  };

  const closeBatchKeywordItemDialog = () => {
    setIsBatchKeywordItemDialogOpen(false);
    setBatchKeywordItemGroupId('');
    setBatchKeywordItemParentId(null);
    setBatchKeywordItemDrafts([createBatchKeywordItemDraft()]);
  };

  const addBatchKeywordItemDraft = () => {
    setBatchKeywordItemDrafts(prev => [...prev, createBatchKeywordItemDraft({ parent_keyword_id: batchKeywordItemParentId })]);
  };

  const updateBatchKeywordItemDraft = (tempId: string, field: keyof BatchKeywordItemDraft, value: string | number | boolean | null) => {
    setBatchKeywordItemDrafts(prev => prev.map(item => item.temp_id === tempId ? { ...item, [field]: value } : item));
  };

  const removeBatchKeywordItemDraft = (tempId: string) => {
    setBatchKeywordItemDrafts(prev => prev.length > 1 ? prev.filter(item => item.temp_id !== tempId) : prev);
  };

  const submitBatchKeywordItems = async () => {
    if (!batchKeywordItemGroupId) {
      toast.error('请先选择关键词分组');
      return;
    }

    const validItems = batchKeywordItemDrafts.filter(item => item.keyword.trim());
    if (validItems.length === 0) {
      toast.error('请至少录入一条关键词');
      return;
    }

    setIsSavingBatchKeywordItems(true);
    try {
      const payload = {
        keyword_group_id: batchKeywordItemGroupId,
        parent_keyword_id: batchKeywordItemParentId,
        items: validItems.map(item => ({
          keyword_item_id: item.keyword_item_id,
          keyword: item.keyword,
          parent_keyword_id: item.parent_keyword_id,
          sort_weight: item.sort_weight,
          is_active: item.is_active,
        })),
      };
      await batchUpsertKeywordItems(payload);
      toast.success('批量关键词已保存');
      closeBatchKeywordItemDialog();
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingBatchKeywordItems(false);
    }
  };

  const openBatchKeywordDialog = (keywordGroupId?: string | null) => {
    const targetGroupId = keywordGroupId || selectedKeywordGroup?.keyword_group_id || '';
    setBatchKeywordApplyForm({
      ...createDefaultBatchKeywordForm(),
      keyword_group_id: targetGroupId,
    });
    setIsBatchKeywordDialogOpen(true);
  };

  const closeBatchKeywordDialog = () => {
    setIsBatchKeywordDialogOpen(false);
    setBatchKeywordApplyForm(createDefaultBatchKeywordForm());
  };

  const toggleBatchKeywordItem = (keywordItemId: string, checked: boolean) => {
    setBatchKeywordApplyForm(prev => ({
      ...prev,
      keyword_item_ids: checked
        ? Array.from(new Set([...prev.keyword_item_ids, keywordItemId]))
        : prev.keyword_item_ids.filter(id => id !== keywordItemId),
    }));
  };

  const toggleBatchKeywordCategory = (selectedCategoryId: string, checked: boolean) => {
    setBatchKeywordApplyForm(prev => ({
      ...prev,
      category_ids: checked
        ? Array.from(new Set([...prev.category_ids, selectedCategoryId]))
        : prev.category_ids.filter(id => id !== selectedCategoryId),
    }));
  };

  const handleBatchKeywordFormChange = <K extends keyof BatchKeywordApplyForm>(field: K, value: BatchKeywordApplyForm[K]) => {
    setBatchKeywordApplyForm(prev => ({ ...prev, [field]: value }));
  };

  const submitBatchKeywordApply = async () => {
    if (!batchKeywordApplyForm.keyword_group_id) {
      toast.error('请先选择关键词分组');
      return;
    }
    if (batchKeywordApplyForm.keyword_item_ids.length === 0) {
      toast.error('请至少选择一个关键词');
      return;
    }
    if (batchKeywordApplyForm.category_ids.length === 0) {
      toast.error('请至少选择一个分类');
      return;
    }

    setIsApplyingKeywords(true);
    try {
      const payload: BatchApplyKeywordsInput = batchKeywordApplyForm;
      const result = await batchApplyKeywordsToCategories(payload);
      setBatchFeedback({ ...result, failed_messages: [] });
      toast.success(`关键词应用完成：成功 ${result.success_count} 条`);
      closeBatchKeywordDialog();
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsApplyingKeywords(false);
    }
  };

  const toggleKeywordGroupExpanded = (keywordGroupId: string) => {
    setExpandedKeywordGroups(prev => ({
      ...prev,
      [keywordGroupId]: !prev[keywordGroupId],
    }));
  };

  const toggleKeywordParentExpanded = (keywordItemId: string) => {
    setExpandedKeywordParents(prev => ({
      ...prev,
      [keywordItemId]: !prev[keywordItemId],
    }));
  };

  const state: CategoryManagementState = {
    list,
    total,
    isLoading,
    page,
    pageSize,
    totalPages,
    searchInput,
    activeKeyword,
    status,
    levelFilter,
    categoryId,
    inlineNameEditingId,
    inlineNameValue,
    isInlineNameSaving,
    weightInputs,
    coefficientInputs,
    isDrawerOpen,
    editingId,
    formData,
    isSubmitting,
    deleteItem,
    isDeleting,
    parentOptions,
    posterConfigs,
    recommendedKeywordItems,
    recommendedKeywordDrafts,
    isSavingRecommendedKeywords,
    topPromotionForm,
    isSavingTopPromotion,
    isPosterDrawerOpen,
    posterForm,
    isSavingPoster,
    quickCreateParentId,
    quickCreateNames,
    isQuickCreating,
    expandedPreviewProducts,
    selectedCategoryIds,
    batchTargetParentId,
    isBatchProcessing,
    keywordGroups,
    keywordCategoryOptions,
    selectedKeywordGroupId,
    expandedKeywordGroups,
    expandedKeywordParents,
    isKeywordGroupDialogOpen,
    keywordGroupForm,
    isSavingKeywordGroup,
    productSearchInput,
    keywordProductRelationScope,
    keywordProductFilters,
    productSearchState,
    isProductSearchLoading,
    selectedKeywordProductIds,
    activeKeywordProductQuery,
    isKeywordItemDialogOpen,
    keywordItemForm,
    isSavingKeywordItem,
    isBatchKeywordItemDialogOpen,
    batchKeywordItemGroupId,
    batchKeywordItemParentId,
    batchKeywordItemDrafts,
    isSavingBatchKeywordItems,
    deletingKeywordGroupId,
    deletingKeywordItemId,
    batchKeywordApplyForm,
    isBatchKeywordDialogOpen,
    isApplyingKeywords,
    keywordSearchInput,
    batchFeedback,
  };

  const handlers: CategoryManagementHandlers = {
    setPage,
    handlePageSizeChange,
    setSearchInput,
    handleSearch,
    handleTabChange,
    handleLevelChange,
    openCreateDrawer,
    closeDrawer,
    handleFormChange,
    submitForm,
    startInlineNameEdit,
    changeInlineNameValue,
    submitInlineNameEdit,
    cancelInlineNameEdit,
    handleInlineStatusChange,
    handleInlineWeightChange,
    handleInlineWeightBlur,
    handleInlineCoefficientChange,
    handleInlineCoefficientBlur,
    onLevel1DragStart,
    onLevel1DragEnter,
    onLevel1DragEnd,
    setDeleteItem,
    confirmDelete,
    navigateToDetail,
    openPosterDrawer,
    closePosterDrawer,
    addPosterItem,
    removePosterItem,
    updatePosterItem,
    savePosterConfig,
    addRecommendedKeywordItem,
    removeRecommendedKeywordItem,
    updateRecommendedKeywordItem,
    saveRecommendedKeywordItems,
    handleTopPromotionFormChange,
    saveTopPromotionConfig,
    setQuickCreateParentId,
    setQuickCreateNames,
    submitQuickCreate,
    togglePreviewProducts,
    toggleCategorySelection,
    toggleSelectAllCurrentPage,
    setBatchTargetParentId,
    handleBatchDelete,
    handleBatchStatus,
    handleBatchMoveParent,
    setSelectedKeywordGroupId,
    toggleKeywordGroupExpanded,
    toggleKeywordParentExpanded,
    openCreateKeywordGroupDialog,
    openEditKeywordGroupDialog,
    closeKeywordGroupDialog,
    handleKeywordGroupFormChange,
    setProductSearchInput,
    setKeywordProductRelationScope,
    handleKeywordProductFilterChange,
    searchGroupProducts,
    toggleKeywordProductSelection,
    toggleSelectAllKeywordProducts,
    handleRemoveKeywordGroupProduct,
    handleBatchRemoveKeywordGroupProducts,
    setKeywordProductPageSize,
    submitKeywordGroupForm,
    handleDeleteKeywordGroup,
    openCreateKeywordItemDialog,
    openEditKeywordItemDialog,
    closeKeywordItemDialog,
    handleKeywordItemFormChange,
    submitKeywordItemForm,
    handleDeleteKeywordItem,
    openBatchKeywordItemDialog,
    closeBatchKeywordItemDialog,
    addBatchKeywordItemDraft,
    updateBatchKeywordItemDraft,
    removeBatchKeywordItemDraft,
    submitBatchKeywordItems,
    openBatchKeywordDialog,
    closeBatchKeywordDialog,
    toggleBatchKeywordItem,
    toggleBatchKeywordCategory,
    handleBatchKeywordFormChange,
    submitBatchKeywordApply,
    setKeywordSearchInput,
  };

  return { state, handlers };
};
