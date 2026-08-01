const fs = require('fs');
const path = 'D:/clash Ver/AutoCoder.cc/src/frontend/components/ProductCategoryView.tsx';
let s = fs.readFileSync(path, 'utf8');

const startMarker = '      <section className={cn(\'mx-auto w-full max-w-[1200px] gap-4 px-4 py-6 sm:px-6\'';
const endMarker = '    </main>;';
const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker);
if (start < 0 || end < 0) throw new Error('markers missing: ' + start + ' ' + end);

const replacement = `      {!showProductResults ? <section className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6" data-controller-name="首页分类浏览与横幅联动区" data-api-unique-id='productcategoryview-r220efc53b28f746c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
        <div className="flex w-full flex-col items-stretch gap-4 rounded-[36px] bg-[#f5f4ef] p-3 shadow-[0_24px_60px_-48px_rgba(0,0,0,0.34)] sm:p-4 lg:flex-row lg:gap-5 lg:p-5" data-api-unique-id='productcategoryview-home-hero-row-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
          <aside className="flex min-h-0 w-full shrink-0 lg:w-[28%] lg:max-w-[300px] lg:self-stretch" data-controller-name="左侧分类浏览模块" data-api-unique-id='productcategoryview-rf59447163630589e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
            <div className="flex h-full min-h-[360px] w-full min-w-0 flex-1 flex-col rounded-[32px] bg-[#f8f7f3] px-4 py-5 shadow-[0_20px_46px_-38px_rgba(0,0,0,0.32)] sm:min-h-[460px] sm:px-5 sm:py-6 lg:min-h-[520px]" data-api-unique-id='productcategoryview-r20809e4690a05a41-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
              <div className="mb-4 flex shrink-0 items-start justify-between gap-3 px-1" data-api-unique-id='productcategoryview-rb92328d6412a4ec6-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                <div data-api-unique-id='productcategoryview-rc5f186c06dfc18eb-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <h3 className="text-[22px] font-semibold text-[#181818] sm:text-[26px]" data-api-unique-id='productcategoryview-r4e0d753aeab96e5c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>分类浏览</h3>
                  <p className="mt-1 text-sm text-[#8c867d]" data-api-unique-id='productcategoryview-rd5b335a95faaa71c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{sideNavZone?.title || 'Hot'}</p>
                </div>
                <span className="pt-1 text-sm text-[#8c867d]" data-api-unique-id='productcategoryview-ra0f71e360245eee4-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{sideNavItems.length > 0 ? \`\${sideNavItems.length} 项\` : \`\${categories.length} 个目录\`}</span>
              </div>
              <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" data-controller-name="首页左侧分类导航按钮列表" data-api-unique-id='productcategoryview-raffcb2fe4e9d618a-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                {sideNavItems.length > 0 ? sideNavItems.map((item, index) => {
                  const isActive = queryState.categoryId === item.category_id;
                  return <button key={item.item_id} type="button" className={\`flex w-full items-center justify-between rounded-[20px] border px-4 py-3.5 text-left text-sm font-medium transition-all sm:px-5 sm:py-4 sm:text-base \${isActive ? 'border-[#191919] bg-[#fdfcf8] text-[#191919] shadow-[0_12px_24px_-22px_rgba(0,0,0,0.6)]' : 'border-transparent bg-[#f1efea] text-[#2a2926] hover:border-[#d2ccc2] hover:bg-white'}\`} onClick={() => handlers.handleSelectCategory(item.category_id)} data-api-unique-id='productcategoryview-rdf25ffb13dc2d1bc-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <span className="truncate pr-4" data-api-unique-id='productcategoryview-r3328bc26f7aca71c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`sideNavItems-\${index}-category_name\`} data-api-map-var-name='item'>{item.category_name}</span>
                      <ChevronRight className={\`size-4 shrink-0 \${isActive ? 'opacity-80' : 'opacity-65'}\`} data-api-unique-id='productcategoryview-rd2a2e67b9f2c83da-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                    </button>;
                }) : categories.map((category, index) => {
                  const isActive = queryState.categoryId === category.category_id || category.children.some(child => child.category_id === queryState.categoryId);
                  return <button key={category.category_id} type="button" className={\`flex w-full items-center justify-between rounded-[20px] border px-4 py-3.5 text-left text-sm font-medium transition-all sm:px-5 sm:py-4 sm:text-base \${isActive ? 'border-[#191919] bg-[#fdfcf8] text-[#191919]' : 'border-transparent bg-[#f1efea] text-[#2a2926] hover:border-[#d2ccc2] hover:bg-white'}\`} onClick={() => handlers.handleSelectCategory(category.category_id)} data-api-unique-id='productcategoryview-r66cc388b37c79e9e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <span className="truncate pr-4" data-api-unique-id='productcategoryview-rc032f8e3e5849211-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`categories-\${index}-category_name\`} data-api-map-var-name='category'>{category.category_name}</span>
                      <ChevronRight className="size-4 shrink-0 opacity-65" data-api-unique-id='productcategoryview-r135e485290992cdc-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                    </button>;
                })}
              </nav>
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 self-stretch" data-controller-name="首页横幅轮播区" data-api-unique-id='productcategoryview-r549ced684abd2c7f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
            {activeBanner ? <div className="relative flex h-full min-h-[360px] w-full flex-1 overflow-hidden rounded-[32px] bg-[#111111] sm:min-h-[460px] lg:min-h-[520px]" data-api-unique-id='productcategoryview-rc2738a2bb48f760c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                <button type="button" className="group relative block h-full min-h-[360px] w-full overflow-hidden bg-[#111111] sm:min-h-[460px] lg:min-h-[520px]" onClick={() => handlers.handleBannerClick(activeBanner)} data-api-unique-id='productcategoryview-re6b0d609650b4efa-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <EditableImg propKey={\`category-poster-\${activeBanner.poster_id}\`} keywords={activeBanner.image_url || activeBanner.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" data-api-unique-id='productcategoryview-r1ba76f4aa78e3c09-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,0.72),rgba(17,17,17,0.18))]" data-api-unique-id='productcategoryview-rbe6fb0b11d49a793-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                  <div className="absolute inset-y-0 left-0 flex w-[90%] max-w-full flex-col items-start justify-center gap-3 px-5 text-left text-white sm:w-[72%] sm:gap-4 sm:px-8 lg:w-[58%] lg:px-12" data-api-unique-id='productcategoryview-r1b6c214c2ea2def3-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <span className="rounded-full border border-white/25 bg-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur-sm" data-api-unique-id='productcategoryview-r8682873e13f0c4f5-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      Latest Drop
                    </span>
                    <div className="space-y-3" data-api-unique-id='productcategoryview-rd3957ec65d74f9da-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      <h3 className="text-[clamp(24px,3.8vw,48px)] font-black uppercase tracking-[0.14em] leading-tight" data-api-unique-id='productcategoryview-r7b94cb5c7c504400-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{activeBanner.title}</h3>
                      {activeBanner.subtitle ? <p className="max-w-[520px] text-sm leading-6 text-white/85 sm:text-base" data-api-unique-id='productcategoryview-r38fc5603036e60ad-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{activeBanner.subtitle}</p> : null}
                    </div>
                    <div className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold tracking-[0.08em] text-[#111111] shadow-[0_10px_30px_-20px_rgba(0,0,0,0.55)]" data-api-unique-id='productcategoryview-re2528365f60b9c7b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      {renderBannerHrefLabel(activeBanner)}
                    </div>
                  </div>
                </button>

                <button type="button" className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-[#111111] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)] transition hover:bg-white sm:left-4 sm:size-11" onClick={() => handlers.handleBannerChange(activeBannerIndex - 1)} aria-label="上一张横幅" data-api-unique-id='productcategoryview-r54014f18580d9e9e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <ChevronLeft className="size-5" data-api-unique-id='productcategoryview-r671215b03c0e2786-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                </button>
                <button type="button" className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-[#111111] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.45)] transition hover:bg-white sm:right-4 sm:size-11" onClick={() => handlers.handleBannerChange(activeBannerIndex + 1)} aria-label="下一张横幅" data-api-unique-id='productcategoryview-r91b5d7ac78d33ec2-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <ChevronRightIcon className="size-5" data-api-unique-id='productcategoryview-ra16ed3630867bbde-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                </button>

                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2" data-api-unique-id='productcategoryview-rf853f0b93917954f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  {posters.map((banner, index) => <button key={banner.poster_id} type="button" className={\`h-2.5 rounded-full transition-all \${index === activeBannerIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'}\`} onClick={() => handlers.handleBannerChange(index)} aria-label={\`切换到第 \${index + 1} 张横幅\`} data-api-unique-id='productcategoryview-ra28ec7f140a8a8b7-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />)}
                </div>
              </div> : <div className="flex min-h-[360px] w-full flex-1 items-center justify-center rounded-[32px] bg-[#111111] text-sm text-white/70 sm:min-h-[460px] lg:min-h-[520px]" data-api-unique-id='productcategoryview-r84623d15968d0d42-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                暂无可展示横幅
              </div>}
          </div>
        </div>

        <section className="mt-6 w-full space-y-5" data-controller-name="推荐关键词楼层区" data-api-unique-id='productcategoryview-rbbc35a071596ce95-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
          {recommendationFloors.length > 0 ? recommendationFloors.map((floor, index) => {
            const isFloorActive = activeRecommendationGroupId === floor.group_id;
            return <div key={floor.group_id} className={\`rounded-[40px] bg-white p-4 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.4)] sm:p-6 \${isFloorActive ? 'ring-2 ring-[#111111]/15' : ''}\`} data-controller-name="推荐关键词楼层卡片" data-api-unique-id='productcategoryview-rd0eef43ba619624f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4" data-api-unique-id='productcategoryview-r696b67c61e8efd65-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                  <div className="flex items-center gap-3" data-api-unique-id='productcategoryview-rcebcc0af56842b28-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#111111] text-white" data-api-unique-id='productcategoryview-rb1cf11fbb77fe23e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <Flame className="size-5" data-api-unique-id='productcategoryview-r73d2f571564b8291-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                    </div>
                    <div data-api-unique-id='productcategoryview-rcb29103897389b8d-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b8477]" data-api-unique-id='productcategoryview-r77d4cca2a4ad9673-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>Floor {index + 1}</p>
                      <h2 className="mt-1 text-[26px] font-semibold tracking-[0.12em] text-[#111111]" data-api-unique-id='productcategoryview-rbff8c23634d2e45a-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`recommendationFloors-\${index}-group_name\`} data-api-map-var-name='floor'>{floor.group_name}</h2>
                      <p className="mt-1 text-sm text-[#6f6a62]" data-api-unique-id='productcategoryview-raf84ac0e74ca05c7-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>点击楼层标题可聚合展示该分组绑定商品，楼层内关键词入口仍可继续进入原有分类筛选链路。</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2" data-api-unique-id='productcategoryview-r400196e86aab0698-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                    <div className="rounded-full border border-[#e6e0d5] bg-[#faf8f3] px-4 py-2 text-sm font-medium text-[#5f5a52]" data-api-unique-id='productcategoryview-r623db2de2905aa3b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`recommendationFloors-\${index}-keywords.length\`} data-api-map-var-name='floor'>
                      {floor.keywords.length} 个关键词
                    </div>
                    <Button type="button" variant="outline" className={\`rounded-full border-[#d8d4ca] bg-white px-4 py-2 text-sm font-medium \${isFloorActive ? 'border-[#111111] bg-[#111111] text-white hover:bg-[#111111]' : 'text-[#111111] hover:bg-[#f3f1eb]'}\`} onClick={() => handlers.handleSelectRecommendationGroup(floor.group_id)} data-api-unique-id='productcategoryview-r2d4422e01806f1fc-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      {isFloorActive ? '查看全部结果中' : '查看本组商品'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-api-unique-id='productcategoryview-r7be088fcd62fc104-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                  {floor.keywords.map((item) => <button key={item.keyword_id} type="button" className="group flex min-h-[88px] flex-col items-start justify-between rounded-[28px] border border-[#ece7dc] bg-[#faf8f3] px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#111111] hover:bg-white" onClick={() => handlers.handleSelectKeyword(item)} data-api-unique-id='productcategoryview-r372953bfdff54fba-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                      <span className="text-base font-semibold text-[#111111] transition-colors group-hover:text-black" data-api-unique-id='productcategoryview-re2ac97899345ac53-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>{renderKeywordLabel(item)}</span>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[#7a756c] group-hover:text-[#111111]" data-api-unique-id='productcategoryview-r6e89f0b3cb9ed46c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                        查看分类
                        <ChevronRight className="size-3.5" data-api-unique-id='productcategoryview-r5116f35fa66ecde1-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                      </span>
                    </button>)}
                </div>
              </div>;
          }) : <></>}
        </section>
      </section> : <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row" data-controller-name="左侧导航与内容区" data-api-unique-id='productcategoryview-r220efc53b28f746c-results-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
        <aside className="w-full min-w-0 shrink-0 self-start lg:w-[28%] lg:max-w-[300px]" data-controller-name="左侧一体化导航栏" data-api-unique-id='productcategoryview-rf59447163630589e-results-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
          <div className="flex w-full flex-col rounded-[32px] bg-white p-4 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.45)] sm:p-5 lg:sticky lg:top-6" data-api-unique-id='productcategoryview-r20809e4690a05a41-results-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
            <section className="space-y-5" data-controller-name="左侧关键词导航模块" data-api-unique-id='productcategoryview-r4d1fcc1beb5d82b1-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
              <nav className="flex flex-wrap gap-2" data-api-unique-id='productcategoryview-r9692dc14d92fba4c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                {leftNavKeywordGroups.map((group, index) => <button key={group.group_id} type="button" className={\`rounded-full border px-4 py-2 text-sm font-medium transition-all \${activeLeftNavGroupId === group.group_id ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#ddd6c8] bg-[#faf8f3] text-[#5f5a52] hover:border-[#111111] hover:bg-white'}\`} onClick={() => handlers.handleSelectLeftNavGroup(group.group_id)} data-api-unique-id='productcategoryview-r1ed338a6f1bf3e37-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`leftNavKeywordGroups-\${index}-group_name\`} data-api-map-var-name='group'>
                    {group.group_name}
                  </button>)}
              </nav>

              <div className="space-y-2" data-api-unique-id='productcategoryview-r8bda9c0b1e98fc59-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                {leftNavKeywords.length > 0 ? leftNavKeywords.map((item) => <button key={item.keyword_id} type="button" className="flex w-full items-center justify-between rounded-[22px] border border-transparent bg-[#faf8f3] px-4 py-3 text-left text-sm font-medium text-[#1f1f1f] transition hover:border-[#111111] hover:bg-white" onClick={() => handlers.handleSelectKeyword(item)} data-api-unique-id='productcategoryview-rd27785a51006d777-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                    <span data-api-unique-id='productcategoryview-r3f9334a38cf21531-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>{renderKeywordLabel(item)}</span>
                    <ChevronRight className="size-4 opacity-60" data-api-unique-id='productcategoryview-rf73003c2f5cf3f11-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                  </button>) : <></>}
              </div>

              <section data-controller-name="左侧分类浏览模块" data-api-unique-id='productcategoryview-reb7d5dd17ce76d71-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                <div className="mb-3 flex items-center justify-between" data-api-unique-id='productcategoryview-rf2f679d002e6c7b0-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <h3 className="text-sm font-semibold tracking-[0.12em] text-[#111111]" data-api-unique-id='productcategoryview-r21a23533be9e0160-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>分类浏览</h3>
                  <span className="text-xs text-[#7a756c]" data-api-unique-id='productcategoryview-rf29c37ba72bee1f5-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{categories.length} 个目录</span>
                </div>
                <nav className="space-y-2" data-api-unique-id='productcategoryview-rf40a744fc6432f94-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  {categories.map((category, index) => {
                    const isExpanded = expandedCategoryIds.includes(category.category_id);
                    const isActive = queryState.categoryId === category.category_id || category.children.some(child => child.category_id === queryState.categoryId);
                    const canToggleChildren = category.display_config.allowChildrenCollapse && category.children.length > 0;
                    return <div key={category.category_id} className="rounded-[24px] border border-transparent bg-[#faf8f3] p-2" data-api-unique-id='productcategoryview-rd9c361a78241e606-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                        <div className="flex items-center gap-2" data-api-unique-id='productcategoryview-rda0b2229b4c847ee-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                          <button type="button" className={\`flex flex-1 items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors \${isActive ? 'bg-[#111111] text-white' : 'text-[#1f1f1f] hover:bg-[#f1eee7]'}\`} onClick={() => handlers.handleSelectCategory(category.category_id)} data-api-unique-id='productcategoryview-r9cff85a11ffebaa9-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                            <span data-api-unique-id='productcategoryview-ra2e9e29454823d64-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`categories-\${index}-category_name\`} data-api-map-var-name='category'>{category.category_name}</span>
                            <span className={\`text-xs \${isActive ? 'text-white/80' : 'text-[#7a756c]'}\`} data-api-unique-id='productcategoryview-r2deb969c70376130-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`categories-\${index}-children.length\`} data-api-map-var-name='category'>{category.children.length}</span>
                          </button>
                          {canToggleChildren ? <button type="button" className="flex size-10 items-center justify-center rounded-2xl text-[#5f5a52] transition-colors hover:bg-[#f1eee7]" onClick={() => handlers.handleToggleCategoryChildren(category.category_id)} aria-label={isExpanded ? '收起二级类目' : '展开二级类目'} data-api-unique-id='productcategoryview-r9bd0f96c3c62c1b9-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                              {isExpanded ? <ChevronDown className="size-4" data-api-unique-id='productcategoryview-r8b1569ddabd6357b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' /> : <ChevronRight className="size-4" data-api-unique-id='productcategoryview-rfb28be2b1cb1de88-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />}
                            </button> : null}
                        </div>
                        {isExpanded && category.children.length > 0 ? <div className="mt-2 space-y-1 px-2 pb-1" data-api-unique-id='productcategoryview-r5cad4b7500aa10cb-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                            {category.children.map((child, index1) => {
                              const isChildActive = queryState.categoryId === child.category_id;
                              return <button key={child.category_id} type="button" className={\`flex w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left text-sm transition-colors \${isChildActive ? 'bg-[#ece7dc] text-[#111111]' : 'text-[#5f5a52] hover:bg-[#f4f1ea]'}\`} onClick={() => handlers.handleSelectCategory(child.category_id)} data-api-unique-id='productcategoryview-r33261a07f77419ef-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                                  <span data-api-unique-id='productcategoryview-rbec0e43b27650ef0-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`categories-\${index}-category.children-\${index1}-category_name\`} data-api-map-var-name='child'>{child.category_name}</span>
                                  <ChevronRight className="size-4 opacity-60" data-api-unique-id='productcategoryview-r16c2e7ceca58b50e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                                </button>;
                            })}
                          </div> : null}
                      </div>;
                  })}
                </nav>
              </section>
            </section>
          </div>
        </aside>

        <div className="min-w-0 w-full flex-1 space-y-6" data-controller-name="右侧商品结果区" data-api-unique-id='productcategoryview-r549ced684abd2c7f-results-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
          <section className="space-y-6" data-controller-name="商品结果展示区" data-api-unique-id='productcategoryview-r81884d5ddb85b4ab-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
              <div className="rounded-[36px] bg-white px-5 py-5 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.4)] sm:px-6 lg:px-8" data-api-unique-id='productcategoryview-r8d0e44f2c72aff49-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                <div className="flex flex-col gap-3 border-b border-[#ece7dc] pb-5 sm:flex-row sm:items-end sm:justify-between" data-api-unique-id='productcategoryview-r54d4d55ec42aabc8-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                  <div data-api-unique-id='productcategoryview-ra6f6136bd984af62-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b8477]" data-api-unique-id='productcategoryview-r10650503c96d0b4c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>Product Results</p>
                    <h2 className="mt-2 text-[28px] font-semibold tracking-[0.08em] text-[#111111]" data-api-unique-id='productcategoryview-reacb97979b8103a0-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{currentCategoryName}</h2>
                    <p className="mt-2 text-sm text-[#6f6a62]" data-api-unique-id='productcategoryview-r84fca975fe17aa7b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>共 {totalCount} 件商品{isSecondaryCategoryResults ? '，当前为二级类目展示样式' : ''}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#6f6a62]" data-api-unique-id='productcategoryview-r6414cea585b640ff-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <span className="rounded-full border border-[#e6e0d5] bg-[#faf8f3] px-4 py-2" data-api-unique-id='productcategoryview-r73b020df813ee0a3-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{activeSortLabel}</span>
                    {selectedStockStatuses.length > 0 ? <span className="rounded-full border border-[#e6e0d5] bg-[#faf8f3] px-4 py-2" data-api-unique-id='productcategoryview-r4c9c835c0e945511-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>{selectedStockStatuses.map((status) => stockStatusLabels[status]).join(' · ')}</span> : null}
                  </div>
                </div>

                {isLoadingProducts ? <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-[#7a756c]" data-api-unique-id='productcategoryview-r9d3a358e517b77c8-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <Loader2 className="size-6 animate-spin" data-api-unique-id='productcategoryview-r2df635ff0c11b943-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                    商品加载中...
                  </div> : products.length > 0 ? <div className={cn('mt-6 grid gap-4 sm:gap-5', isSecondaryCategoryResults ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3')} data-api-unique-id='productcategoryview-r14d0c19cf3b6eaf2-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    {products.map((item, index) => isSecondaryCategoryResults ? <article key={item.product_id} className="group overflow-hidden rounded-[28px] border border-[#ece7dc] bg-[#faf8f3] p-3 shadow-[0_14px_32px_-28px_rgba(17,17,17,0.35)] transition hover:-translate-y-0.5 hover:border-[#d8d1c3] hover:bg-white" data-controller-name="二级类目商品图片名称卡片" data-api-unique-id='productcategoryview-r32b18a9659b7b902-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                          <div className="overflow-hidden rounded-[22px] bg-white" data-api-unique-id='productcategoryview-r4258dce74570eb34-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                            <EditableImg propKey={\`secondary-category-product-\${item.product_id}\`} keywords={item.main_image_url || item.product_name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]" data-api-unique-id='productcategoryview-rad872acddaea135f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                          </div>
                          <button type="button" className="mt-4 line-clamp-2 text-left text-sm font-semibold leading-6 text-[#111111] transition-colors hover:text-[#5f4b32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20" onClick={() => handlers.handleNavigateToDetail(item.product_id)} data-api-unique-id='productcategoryview-rd174d29aca0657d5-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`products-\${index}-product_name\`} data-api-map-var-name='item'>
                            {item.product_name}
                          </button>
                        </article> : <article key={item.product_id} className="group overflow-hidden rounded-[32px] border border-[#ece7dc] bg-[#faf8f3] p-4 shadow-[0_18px_42px_-30px_rgba(17,17,17,0.35)] transition hover:-translate-y-0.5 hover:border-[#111111] hover:bg-white" data-controller-name="分类商品信息卡片" data-api-unique-id='productcategoryview-re8a03e2a642c5063-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                          <div className="overflow-hidden rounded-[24px] bg-white" data-api-unique-id='productcategoryview-rda6c1eb88be3bcb2-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                            <EditableImg propKey={\`category-product-\${item.product_id}\`} keywords={item.main_image_url || item.product_name} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]" data-api-unique-id='productcategoryview-r58eaf4975cc7a70b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                          </div>
                          <div className="mt-5 space-y-4" data-api-unique-id='productcategoryview-r2f241ee510e281f1-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                            <button type="button" className="line-clamp-2 text-left text-lg font-semibold leading-7 text-[#111111] transition-colors hover:text-[#5f4b32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20" onClick={() => handlers.handleNavigateToDetail(item.product_id)} data-api-unique-id='productcategoryview-r758bdada1fdc7495-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`products-\${index}-product_name\`} data-api-map-var-name='item'>
                              {item.product_name}
                            </button>
                            <div className="flex items-center gap-3 text-sm text-[#7a756c]" data-api-unique-id='productcategoryview-rb5b7f4d7267e5b6e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                              <div className="flex items-center gap-1" data-api-unique-id='productcategoryview-r1957f2738020be8c-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>{renderRatingStars(item.rating_average)}</div>
                              <span data-api-unique-id='productcategoryview-r7f157b192668215d-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>{item.rating_average.toFixed(1)} / 5</span>
                              <span data-api-unique-id='productcategoryview-rc642b579ef5577c5-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`products-\${index}-rating_count\`} data-api-map-var-name='item'>({item.rating_count})</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2" data-api-unique-id='productcategoryview-r4596747e170d34e3-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                              {item.has_discount && item.original_price ? <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1e7] px-3 py-1 text-xs font-semibold text-[#c46a1a]" data-api-unique-id='productcategoryview-r067637209324fb60-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                                  <BadgePercent className="size-3.5" data-api-unique-id='productcategoryview-r801db9c835963642-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                                  限时优惠
                                </span> : null}
                              <span className={\`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold \${item.stock_status === 'OUT_OF_STOCK' ? 'bg-[#f3e6e6] text-[#b54b4b]' : item.stock_status === 'LOW_STOCK' ? 'bg-[#fff4e4] text-[#b87817]' : 'bg-[#e8f4ec] text-[#2d7a4b]'}\`} data-api-unique-id='productcategoryview-r0692af3b38c97c0e-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                                <Boxes className="size-3.5" data-api-unique-id='productcategoryview-r75e26655bfdcf9cc-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                                {stockStatusLabels[item.stock_status]}
                              </span>
                            </div>
                            <div className="flex items-end justify-between gap-3" data-api-unique-id='productcategoryview-r60d6175d0b5de2c2-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                              <div data-api-unique-id='productcategoryview-rb2ef396301338c16-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                                <p className="text-2xl font-bold text-[#111111]" data-api-unique-id='productcategoryview-r33e529936672584f-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>{formatPrice(item.price)}</p>
                                {item.original_price ? <p className="mt-1 text-sm text-[#8b8477] line-through" data-api-unique-id='productcategoryview-r04f75d7aa58c54f5-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>{formatPrice(item.original_price)}</p> : <p className="mt-1 text-sm text-[#8b8477]" data-api-unique-id='productcategoryview-rcd801deebc2c91f3-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' data-api-bind-info={\`products-\${index}-sku_count\`} data-api-map-var-name='item'>{item.sku_count} 个可选规格</p>}
                              </div>
                              <Button type="button" className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#262626]" onClick={() => handlers.handleAddToCart(item)} data-api-unique-id='productcategoryview-r3be214e45b4a3b94-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1'>
                                <ShoppingCart className="mr-2 size-4" data-api-unique-id='productcategoryview-r4a3aeb7841c71418-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' data-api-in-loop='1' />
                                加入购物车
                              </Button>
                            </div>
                          </div>
                        </article>)}
                  </div> : <div className="mt-6 rounded-[28px] border border-dashed border-[#ddd6c8] bg-[#faf8f3] px-6 py-14 text-center" data-api-unique-id='productcategoryview-rf8e519298f81db85-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#ebe7de] text-[#111111]" data-api-unique-id='productcategoryview-re1ac063fbce010dd-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>
                      <Package className="size-6" data-api-unique-id='productcategoryview-r6345d54118218303-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView' />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-[#111111]" data-api-unique-id='productcategoryview-rfe3d71fe117bd8be-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>暂无符合条件的商品</h3>
                    <p className="mt-2 text-sm text-[#7a756c]" data-api-unique-id='productcategoryview-rf2517b47779e392b-s780999859' data-api-unique-page-name='src/frontend/components/ProductCategoryView'>请尝试切换其它分类或筛选条件，已上架商品会在这里展示。</p>
                  </div>}
              </div>
            </section>
        </div>
      </section>}
`;

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(path, s);
console.log('ok', s.length);
