'use client'
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryManagement } from '@/backend/route-params';
import type {
  CategoryItem,
  CategoryOption,
  CategoryStatus,
  CategoryLevel,
  HomepagePosterConfig,
  HomepagePosterItem,
  GetCategoryListInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  SaveHomepagePosterConfigInput,
} from '@/backend/actions/CategoryManagement';
import {
  getCategoryList,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  updateCategorySortWeight,
  saveHomepagePosterConfig,
  deleteCategory
} from '@/backend/actions/CategoryManagement';
import { toast } from 'sonner';

export const STATUS_LABELS: Record<CategoryStatus, string> = {
  ACTIVE: '激活',
  INACTIVE: '停用',
};

export const LEVEL_LABELS: Record<CategoryLevel, string> = {
  1: '一级分类',
  2: '二级分类',
};

interface FormFields {
  category_name: string;
  category_slug: string;
  parent_id: string | null;
  level: CategoryLevel;
  image_url: string;
  banner_image_url: string;
  description: string;
  sort_weight: number;
  status: CategoryStatus;
}

interface PosterFormState {
  category_id: string;
  category_name: string;
  items: HomepagePosterItem[];
}

const DEFAULT_FORM_DATA: FormFields = {
  category_name: '',
  category_slug: '',
  parent_id: null,
  level: 1,
  image_url: '',
  banner_image_url: '',
  description: '',
  sort_weight: 0,
  status: 'ACTIVE'
};

const createPosterItem = (index: number): HomepagePosterItem => ({
  id: `poster-${Date.now()}-${index}`,
  title: '',
  image_url: '',
  link: '',
  sort_weight: index,
  is_active: true,
});

export interface CategoryManagementState {
  list: CategoryItem[];
  total: number;
  isLoading: boolean;
  page: number;
  pageSize: number;
  searchInput: string;
  activeKeyword: string;
  weightInputs: Record<string, string>;
  isDrawerOpen: boolean;
  editingId: string | null;
  formData: FormFields;
  isSubmitting: boolean;
  deleteItem: CategoryItem | null;
  isDeleting: boolean;
  totalPages: number;
  status: string | undefined;
  categoryId: string | undefined;
  levelFilter: 'ALL' | '1' | '2';
  parentOptions: CategoryOption[];
  posterConfigs: HomepagePosterConfig[];
  isPosterDrawerOpen: boolean;
  posterForm: PosterFormState | null;
  isSavingPoster: boolean;
  selectedLevelTab: 'ALL' | '1' | '2';
}

export interface CategoryManagementHandlers {
  setPage: (page: number | ((prev: number) => number)) => void;
  setSearchInput: (val: string) => void;
  handleSearch: () => void;
  handleTabChange: (val: string) => void;
  handleLevelChange: (val: 'ALL' | '1' | '2') => void;
  openCreateDrawer: (level?: CategoryLevel, parentId?: string | null) => void;
  closeDrawer: () => void;
  handleFormChange: <K extends keyof FormFields>(field: K, value: FormFields[K]) => void;
  submitForm: () => Promise<void>;
  handleInlineStatusChange: (item: CategoryItem, checked: boolean) => Promise<void>;
  handleInlineWeightChange: (id: string, value: string) => void;
  handleInlineWeightBlur: (item: CategoryItem) => Promise<void>;
  setDeleteItem: (item: CategoryItem | null) => void;
  confirmDelete: () => Promise<void>;
  navigateToDetail: (id: string) => void;
  openPosterDrawer: (item: CategoryItem) => void;
  closePosterDrawer: () => void;
  addPosterItem: () => void;
  removePosterItem: (id: string) => void;
  updatePosterItem: <K extends keyof HomepagePosterItem>(id: string, field: K, value: HomepagePosterItem[K]) => void;
  savePosterConfig: () => Promise<void>;
}

export const useCategoryManagement = (): { state: CategoryManagementState, handlers: CategoryManagementHandlers } => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, categoryId } = CategoryManagement.getParams(searchParams);

  const [list, setList] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormFields>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteItem, setDeleteItem] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [levelFilter, setLevelFilter] = useState<'ALL' | '1' | '2'>('ALL');
  const [parentOptions, setParentOptions] = useState<CategoryOption[]>([]);
  const [posterConfigs, setPosterConfigs] = useState<HomepagePosterConfig[]>([]);
  const [isPosterDrawerOpen, setIsPosterDrawerOpen] = useState(false);
  const [posterForm, setPosterForm] = useState<PosterFormState | null>(null);
  const [isSavingPoster, setIsSavingPoster] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const levelOneOptions = useMemo(
    () => parentOptions.filter(item => item.level === 1),
    [parentOptions]
  );

  const loadData = useCallback(async (
    targetPage: number,
    targetKeyword: string,
    targetStatus: string | undefined,
    targetLevel: 'ALL' | '1' | '2'
  ) => {
    setIsLoading(true);
    try {
      const payload: GetCategoryListInput = {
        page: targetPage,
        page_size: pageSize,
      };
      if (targetKeyword) payload.keyword = targetKeyword;
      if (targetStatus && (targetStatus === 'ACTIVE' || targetStatus === 'INACTIVE')) {
        payload.status = targetStatus as CategoryStatus;
      }
      if (targetLevel === '1' || targetLevel === '2') {
        payload.level = Number(targetLevel) as CategoryLevel;
      }

      const res = await getCategoryList(payload);
      setList(res.list);
      setTotal(res.total);
      setParentOptions(res.parent_options);
      setPosterConfigs(res.poster_configs);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadData(page, activeKeyword, status, levelFilter);
  }, [loadData, page, activeKeyword, status, levelFilter]);

  useEffect(() => {
    if (categoryId && list.length > 0 && !isDrawerOpen) {
      const target = list.find(item => item.category_id === categoryId);
      if (target) {
        setEditingId(target.category_id);
        setFormData({
          category_name: target.category_name,
          category_slug: target.category_slug,
          parent_id: target.parent_id,
          level: target.level,
          image_url: target.image_url || '',
          banner_image_url: target.banner_image_url || '',
          description: target.description || '',
          sort_weight: target.sort_weight,
          status: target.status,
        });
        setIsDrawerOpen(true);
      }
    }
  }, [categoryId, list, isDrawerOpen]);

  const handleTabChange = (val: string) => {
    setPage(1);
    if (val === 'ALL') {
      CategoryManagement.navigateToAll(router);
    } else {
      CategoryManagement.navigateToFiltered(router, { status: val });
    }
  };

  const handleLevelChange = (val: 'ALL' | '1' | '2') => {
    setPage(1);
    setLevelFilter(val);
  };

  const handleSearch = () => {
    setPage(1);
    setActiveKeyword(searchInput);
  };

  const openCreateDrawer = (level: CategoryLevel = 1, parentId: string | null = null) => {
    setEditingId(null);
    setFormData({
      ...DEFAULT_FORM_DATA,
      level,
      parent_id: level === 2 ? parentId : null,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
    if (categoryId) {
      if (status) {
        CategoryManagement.navigateToFiltered(router, { status });
      } else {
        CategoryManagement.navigateToAll(router);
      }
    }
  };

  const closePosterDrawer = () => {
    setIsPosterDrawerOpen(false);
    setPosterForm(null);
  };

  const handleFormChange = <K extends keyof FormFields>(field: K, value: FormFields[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'level') {
        next.parent_id = value === 2 ? next.parent_id : null;
      }
      if (field === 'parent_id' && !value) {
        next.parent_id = null;
      }
      return next;
    });
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      if (formData.level === 2 && !formData.parent_id) {
        throw new Error('二级分类必须选择上级分类');
      }

      if (editingId) {
        const payload: UpdateCategoryInput = {
          category_id: editingId,
          ...formData,
        };
        await updateCategory(payload);
        toast.success('分类更新成功');
      } else {
        const payload: CreateCategoryInput = {
          ...formData,
        };
        await createCategory(payload);
        toast.success('分类创建成功');
      }
      closeDrawer();
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineStatusChange = async (item: CategoryItem, checked: boolean) => {
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
    try {
      await updateCategoryStatus({ category_id: item.category_id, status: newStatus });
      toast.success('状态切换成功');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleInlineWeightChange = (id: string, value: string) => {
    setWeightInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleInlineWeightBlur = async (item: CategoryItem) => {
    const inputValue = weightInputs[item.category_id];
    if (inputValue === undefined) return;

    const newWeight = parseInt(inputValue, 10);
    if (isNaN(newWeight) || newWeight === item.sort_weight) return;

    try {
      await updateCategorySortWeight({ category_id: item.category_id, sort_weight: newWeight });
      toast.success('排序更新成功');
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await deleteCategory({ category_id: deleteItem.category_id });
      toast.success('分类删除成功');
      setDeleteItem(null);
      await loadData(page, activeKeyword, status, levelFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const navigateToDetail = (id: string) => {
    CategoryManagement.navigateToDetail(router, { categoryId: id });
  };

  const openPosterDrawer = (item: CategoryItem) => {
    const existing = posterConfigs.find(config => config.category_id === item.category_id);
    setPosterForm({
      category_id: item.category_id,
      category_name: item.category_name,
      items: existing?.items.length ? existing.items : [createPosterItem(0)],
    });
    setIsPosterDrawerOpen(true);
  };

  const addPosterItem = () => {
    setPosterForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [...prev.items, createPosterItem(prev.items.length)],
      };
    });
  };

  const removePosterItem = (id: string) => {
    setPosterForm(prev => {
      if (!prev) return prev;
      const nextItems = prev.items.filter(item => item.id !== id);
      return {
        ...prev,
        items: nextItems.length ? nextItems : [createPosterItem(0)],
      };
    });
  };

  const updatePosterItem = <K extends keyof HomepagePosterItem>(id: string, field: K, value: HomepagePosterItem[K]) => {
    setPosterForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
      };
    });
  };

  const savePosterConfig = async () => {
    if (!posterForm) return;
    setIsSavingPoster(true);
    try {
      const payload: SaveHomepagePosterConfigInput = {
        category_id: posterForm.category_id,
        items: posterForm.items,
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

  const state: CategoryManagementState = {
    list,
    total,
    isLoading,
    page,
    pageSize,
    searchInput,
    activeKeyword,
    weightInputs,
    isDrawerOpen,
    editingId,
    formData,
    isSubmitting,
    deleteItem,
    isDeleting,
    totalPages,
    status,
    categoryId,
    levelFilter,
    parentOptions: levelOneOptions,
    posterConfigs,
    isPosterDrawerOpen,
    posterForm,
    isSavingPoster,
    selectedLevelTab: levelFilter,
  };

  const handlers: CategoryManagementHandlers = {
    setPage,
    setSearchInput,
    handleSearch,
    handleTabChange,
    handleLevelChange,
    openCreateDrawer,
    closeDrawer,
    handleFormChange,
    submitForm,
    handleInlineStatusChange,
    handleInlineWeightChange,
    handleInlineWeightBlur,
    setDeleteItem,
    confirmDelete,
    navigateToDetail,
    openPosterDrawer,
    closePosterDrawer,
    addPosterItem,
    removePosterItem,
    updatePosterItem,
    savePosterConfig,
  };

  return { state, handlers };
};
