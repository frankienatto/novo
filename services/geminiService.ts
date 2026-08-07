import { 
    Booking, Room, Staff, StaffTask, AdPlatform, CampaignGoal, AdCampaign, AdSet, 
    MarketingMixPlan, CampaignPhase, Expense, Transaction, PropertyEvent, 
    PropertyInfo, DBState, DailyBriefing, Persona, BriefingActionType, Project, 
    TaskStatus, Product, Guest, LocalGuideTip, ManagementReport, AdminSection, 
    BrandIdentity, CampaignIdea, RoomType, RoomStatus, BusinessDiagnosis, ExpansionSimulation, 
    ProfitabilityOpportunity, MarketAnalysis, AdSpy, CreativeAsset, GrowthHack, 
    AdPlatformString, GrowthHubInsight, GrowthHubAction, ProjectHealthAnalysis, 
    ProjectRisk, ProjectTaskSuggestion, ProjectFinancialAnalysis, WeeklyPostSuggestion, 
    BriefingAction, SaleItem, POSSuggestion, DashboardActionCard, AISuggestedPrice, 
    AIMenuPriceAnalysis, SurveillanceAnalysis, DynamicPriceSuggestion, GroundingChunk, 
    Review, ReviewAnalysis, ReplySuggestion, EquipmentInfoSuggestion, MaintenanceSuggestion, 
    AutomationRule, ChatConversation, CampaignPerformanceAnalysis, DigitalMenuCategory, 
    MarketInsight, AIPackageSuggestion, AIConciergeMessage
} from '../types';

export const Type = {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT'
} as const;

const geminiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (error.message?.includes('429')) {
                await sleep(Math.pow(2, i) * 1000);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

const callGemini = async (prompt: string, schema: any, systemInstruction?: string): Promise<any | null> => {
    const cacheKey = btoa(unescape(encodeURIComponent(prompt + JSON.stringify(schema))));
    if (geminiCache[cacheKey] && Date.now() - geminiCache[cacheKey].timestamp < CACHE_TTL) {
        return geminiCache[cacheKey].data;
    }

    try {
        const response = await withRetry(async () => {
             const result = await fetch('/api/gemini/generateText', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ prompt, schema, systemInstruction })
             });
             
             if (!result.ok) {
                 const errorData = await result.json().catch(() => ({}));
                 throw new Error(errorData.error || `HTTP error ${result.status}`);
             }
             
             return await result.json();
        });

        geminiCache[cacheKey] = { data: response, timestamp: Date.now() };
        return response;
    } catch (error: any) {
        console.error("Gemini Proxy Call Error:", error);
        import('./apiService').then(({ eventBus }) => {
            eventBus.emit('new-toast', { type: 'error', title: 'Erro de IA', message: error.message || 'Falha ao conectar com o modelo GEMINI.' });
        });
        return null;
    }
};

// --- Schemas (Restoring key ones) ---

const personaSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        age: { type: Type.NUMBER },
        bio: { type: Type.STRING },
        interests: { type: Type.ARRAY, items: { type: Type.STRING } },
        engagementRoadmap: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { action: { type: Type.STRING } } } }
    },
    required: ["name", "age", "bio", "interests", "engagementRoadmap"]
};

const briefingSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                points: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "points"]
        },
        attentionPoints: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                points: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            severity: { type: Type.STRING, description: "Must be High, Medium, or Low" },
                            action: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    label: { type: Type.STRING },
                                    payload: { type: Type.OBJECT }
                                },
                                required: ["type", "label"]
                            }
                        },
                        required: ["text", "severity"]
                    }
                }
            },
            required: ["title", "points"]
        },
        proactiveSuggestions: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                points: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            action: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    label: { type: Type.STRING },
                                    payload: { type: Type.OBJECT }
                                },
                                required: ["type", "label"]
                            }
                        },
                        required: ["text"]
                    }
                }
            },
            required: ["title", "points"]
        }
    },
    required: ["summary", "attentionPoints", "proactiveSuggestions"]
};

const dashboardActionsSchema = {
    type: Type.OBJECT,
    properties: {
        actions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    justification: { type: Type.STRING },
                    icon: { type: Type.STRING, description: "Must be exactly one of: Megaphone, ClipboardCheck, TrendingUp, Lightbulb, Star, Warehouse, ClipboardList" },
                    action: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            label: { type: Type.STRING },
                            payload: { type: Type.OBJECT }
                        },
                        required: ["type", "label"]
                    }
                },
                required: ["title", "justification", "icon", "action"]
            }
        }
    },
    required: ["actions"]
};

const marketAnalysisLabSchema = {
    type: Type.OBJECT,
    properties: {
        trafficSources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING },
                    percentage: { type: Type.NUMBER }
                },
                required: ["source", "percentage"]
            }
        },
        topKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        audienceProfile: { type: Type.STRING },
        seoOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["trafficSources", "topKeywords", "audienceProfile", "seoOpportunities"]
};

const marketInsightsResponseSchema = {
    type: Type.OBJECT,
    properties: {
        insights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING, description: "Must be exactly one of: Feriado, Evento, Tendência, Concorrência" },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impactLevel: { type: Type.STRING, description: "Must be exactly one of: Alto, Médio, Baixo" }
                },
                required: ["id", "category", "title", "description", "impactLevel"]
            }
        }
    },
    required: ["insights"]
};

const contentPlanSchema = {
    type: Type.OBJECT,
    properties: {
        posts: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { 
                    day: { type: Type.STRING },
                    content: { type: Type.STRING },
                    platforms: { type: Type.ARRAY, items: { type: Type.STRING } }
                } 
            } 
        }
    }
};

const replySuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING },
        sentiment: { type: Type.STRING }
    }
};

const realBusinessDiagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        keyInsights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    insight: { type: Type.STRING },
                    data: { type: Type.STRING }
                },
                required: ["insight", "data"]
            }
        },
        crossModuleCorrelations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    finding: { type: Type.STRING },
                    implication: { type: Type.STRING }
                },
                required: ["finding", "implication"]
            }
        },
        warnings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    warning: { type: Type.STRING },
                    recommendation: { type: Type.STRING }
                },
                required: ["warning", "recommendation"]
            }
        }
    },
    required: ["keyInsights", "crossModuleCorrelations", "warnings"]
};

const profitabilityPlanSchema = {
    type: Type.OBJECT,
    properties: {
        pricingSuggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    roomType: { type: Type.STRING, description: "Must be: Quarto Coletivo, Quarto Privativo, Suíte Casal, Coworking Diário" },
                    newPrice: { type: Type.NUMBER },
                    period: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    weekendSuggestion: { type: Type.STRING }
                },
                required: ["roomType", "newPrice", "period", "reason", "weekendSuggestion"]
            }
        },
        packageDeals: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    dealName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    marketingSuggestion: {
                        type: Type.OBJECT,
                        properties: {
                            channel: { type: Type.STRING, description: "Must be: Anúncio no Instagram, Post Orgânico, Campanha de Email" },
                            headline: { type: Type.STRING },
                            callToAction: { type: Type.STRING }
                        },
                        required: ["channel", "headline", "callToAction"]
                    }
                },
                required: ["dealName", "description", "marketingSuggestion"]
            }
        }
    },
    required: ["pricingSuggestions", "packageDeals"]
};

const expansionSimulationSchema = {
    type: Type.OBJECT,
    properties: {
        simulationSummary: { type: Type.STRING },
        estimatedCost: { type: Type.STRING },
        projectedRevenueIncrease: { type: Type.STRING },
        estimatedROI: { type: Type.STRING },
        risksAndConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["simulationSummary", "estimatedCost", "projectedRevenueIncrease", "estimatedROI", "risksAndConsiderations"]
};

const growthHubInsightsSchema = {
    type: Type.OBJECT,
    properties: {
        insights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "Must be exactly one of: performance, opportunity, creative" },
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    action: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            label: { type: Type.STRING },
                            payload: {
                                type: Type.OBJECT,
                                properties: {
                                    section: { type: Type.STRING }
                                }
                            }
                        },
                        required: ["type", "label"]
                    }
                },
                required: ["type", "title", "text", "action"]
            }
        }
    },
    required: ["insights"]
};

const recommendedActionsSchema = {
    type: Type.OBJECT,
    properties: {
        actions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING, description: "Specifically one of: BarChart2, Palette, Lightbulb" },
                    action: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            label: { type: Type.STRING },
                            payload: {
                                type: Type.OBJECT,
                                properties: {
                                    section: { type: Type.STRING }
                                }
                            }
                        },
                        required: ["type", "label"]
                    }
                },
                required: ["title", "description", "icon", "action"]
            }
        }
    },
    required: ["actions"]
};

const adSpySchema = {
    type: Type.OBJECT,
    properties: {
        competitorName: { type: Type.STRING },
        strategy: { type: Type.STRING },
        exampleAds: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING },
                    description: { type: Type.STRING },
                    creativeDescription: { type: Type.STRING }
                },
                required: ["headline", "description", "creativeDescription"]
            }
        },
        counterStrategy: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["competitorName", "strategy", "exampleAds", "counterStrategy"]
};

const creativeAssetSchema = {
    type: Type.OBJECT,
    properties: {
        assetType: { type: Type.STRING, description: "Must be exactly one of: Imagem, Vídeo" },
        topic: { type: Type.STRING },
        imagePrompt: { type: Type.STRING },
        textOverlays: { type: Type.ARRAY, items: { type: Type.STRING } },
        videoScript: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scene: { type: Type.INTEGER },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING }
                },
                required: ["scene", "description", "duration"]
            }
        },
        suggestedAudio: { type: Type.STRING }
    },
    required: ["assetType", "topic"]
};

const growthHacksResponseSchema = {
    type: Type.OBJECT,
    properties: {
        hacks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    difficulty: { type: Type.STRING, description: "Must be exactly one of: Fácil, Média, Difícil" }
                },
                required: ["title", "description", "difficulty"]
            }
        }
    },
    required: ["hacks"]
};

const posSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    productId: { type: Type.STRING },
                    productName: { type: Type.STRING },
                    justification: { type: Type.STRING }
                },
                required: ["productId", "productName", "justification"]
            }
        }
    },
    required: ["suggestions"]
};

const emailContentSchema = {
    type: Type.OBJECT,
    properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING }
    },
    required: ["subject", "body"]
};

const scheduleSchema = {
    type: Type.OBJECT,
    properties: {
        schedule: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING },
                    shifts: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                staffName: { type: Type.STRING },
                                shift: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    }
};

const onboardingSchema = {
    type: Type.OBJECT,
    properties: {
        plan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.NUMBER },
                    theme: { type: Type.STRING },
                    mentor: { type: Type.STRING },
                    tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    }
};

const performanceSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        mostProductive: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING }
            },
            nullable: true
        }
    }
};

export const generateSinglePersona = (audienceDescription: string) => 
    callGemini(`Crie uma persona ultra-detalhada para: ${audienceDescription}. Use o idioma Português (Brasil).`, personaSchema);

export const generateDailyBriefing = (db: DBState) => {
    const context = `Status atual: ${db.bookings.length} reservas ativas, ${db.rooms.filter(r=>r.status===RoomStatus.OCCUPIED).length} quartos ocupados, ${db.staffTasks.filter(t=>t.status===TaskStatus.TODO).length} tarefas pendentes.`;
    return callGemini(`Gere um briefing gerencial consolidado para o hotel. Contexto: ${context}. Idioma: Português (Brasil).`, briefingSchema);
};

export const routeSynapseCommand = (command: string, context: DBState) => {
    return callGemini(`Interprete o seguinte comando de voz/texto para o sistema PMS: "${command}". 
        O sistema possui as seções: Dashboard, Calendário, Reservas, Quartos, Financeiro, Marketing, PDV, Staff.
        Retorne para qual seção ou ação o usuário deseja ir.`, { type: Type.OBJECT, properties: { action: { type: Type.STRING }, target: { type: Type.STRING }, response: { type: Type.STRING } } });
};

export const analyzeReview = (reviewText: string) => {
    return callGemini(`Analise o seguinte comentário de hóspede: "${reviewText}".`, {
        type: Type.OBJECT,
        properties: {
            sentiment: { type: Type.STRING },
            score: { type: Type.NUMBER },
            mainPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
};

export const generateReviewReply = (reviewText: string, language: string = 'Português') => {
    return callGemini(`Escreva uma resposta profissional e amigável para este comentário em ${language}: "${reviewText}".`, replySuggestionSchema);
};

export const generateBusinessDiagnosis = (db: DBState) => {
    const data = `Reservas: ${db.bookings.length}, Transações: ${db.transactions.length}, Quartos: ${db.rooms.length}.`;
    return callGemini(`Realize um diagnóstico empresarial de hotelaria com base nestes dados: ${data}.`, realBusinessDiagnosisSchema);
};

export const getAIConciergeResponse = (history: AIConciergeMessage[], lastMessage: string, property: PropertyInfo) => {
    const historyText = history.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    return callGemini(`Você é o Concierge Digital do ${property.name}. 
        Histórico recente:
        ${historyText}
        
        O hóspede perguntou: "${lastMessage}". 
        Responda de forma prestativa, elegante e descontraída em Português.`, { type: Type.OBJECT, properties: { response: { type: Type.STRING }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } } });
};

export const generateWeeklyContentPlan = (theme: string, property: PropertyInfo, ...args: any[]) => {
    return callGemini(`Gere um plano semanal de conteúdo para redes sociais (Instagram/Facebook) para o hotel ${property.name}. Tema semanal: ${theme}.`, contentPlanSchema);
};

export const generateCampaignIdeas = (goal: string, brandIdentity?: BrandIdentity) => {
    return callGemini(`Gere 3 ideias criativas de campanhas de marketing para atrair mais hóspedes. 
        Objetivo: ${goal}. 
        Vibe: ${brandIdentity?.vibeKeywords || 'Descontraído'}.`, {
        type: Type.OBJECT,
        properties: {
            imagePrompts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, prompt: { type: Type.STRING } } } },
            videoScript: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, scenes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { scene: { type: Type.NUMBER }, description: { type: Type.STRING } } } } } },
            captions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: { type: Type.STRING }, text: { type: Type.STRING } } } },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
};

export const generateSuggestedSellPrice = (name: string, category: string, costPrice: number) => {
    return callGemini(`Sugira um preço de venda dinâmico para o item "${name}" (Categoria: ${category}). Custo: R$${costPrice}.`, {
        type: Type.OBJECT,
        properties: {
            suggestedPrice: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
        }
    });
};

// ... keep others as mock or slowly implement more if needed ...
const callServerAI_mock = (name: string, ...args: any[]) => {
    console.warn(`${name} fallback called.`);
    return null;
};

export const generateWorkSchedule = (staff: Staff[], constraints: string) => {
    const staffList = staff.map(s => `${s.name} (${s.role})`).join(', ');
    return callGemini(`Gere uma escala de trabalho semanal para a equipe: ${staffList}. Restrições: ${constraints}.`, scheduleSchema);
};

export const generateOnboardingPlan = (name: string, role: string, staff: Staff[]) => {
    const mentors = staff.filter(s => s.role === 'Super Administrador' || s.role === 'Gerente').map(s => s.name).join(', ');
    return callGemini(`Gere um plano de onboarding de 3 dias para o novo funcionário ${name} no cargo ${role}. Mentores disponíveis: ${mentors}.`, onboardingSchema);
};

export const analyzeTeamPerformance = (tasks: StaffTask[], staff: Staff[], targetStaffId?: string) => {
    const relevantTasks = targetStaffId ? tasks.filter(t => t.assigneeId === targetStaffId) : tasks;
    const taskSummary = relevantTasks.slice(-20).map(t => `${t.description} - Status: ${t.status}`).join('\n');
    const staffName = targetStaffId ? staff.find(s => s.id === targetStaffId)?.name : 'Toda a Equipe';
    
    return callGemini(`Analise a performance de ${staffName} com base nestas tarefas:\n${taskSummary}`, performanceSchema);
};

export const generateCheckoutTasks = (roomId: number, roomName: string) => {
    return callGemini(`Gere uma lista de 5 tarefas de limpeza para o check-out do quarto ${roomName} (ID: ${roomId}).`, {
        type: Type.OBJECT,
        properties: {
            tasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
};

export const generateProjectTasks = (projectName: string, description: string) => {
    return callGemini(`Gere uma lista de 5 tarefas prioritárias para o projeto "${projectName}": ${description}.`, {
        type: Type.OBJECT,
        properties: {
            tasks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        estimatedHours: { type: Type.NUMBER }
                    }
                }
            }
        }
    });
};

export const generateMarketingMixPlan = (objective: string, budget: number, period: string) => {
    return callGemini(`Gere um plano de Marketing Mix (4Ps) para o Forest House Beach com o objetivo: "${objective}", orçamento: R$ ${budget} e período: ${period}.`, {
        type: Type.OBJECT,
        properties: {
            product: { type: Type.STRING },
            price: { type: Type.STRING },
            place: { type: Type.STRING },
            promotion: { type: Type.STRING },
            summary: { type: Type.STRING },
            phases: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        phaseName: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        actions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            },
            budgetSplit: {
                type: Type.OBJECT,
                properties: {
                    'Meta Ads': { type: Type.NUMBER },
                    'Google Ads': { type: Type.NUMBER },
                    'TikTok Ads': { type: Type.NUMBER }
                }
            }
        }
    });
};

export const generateDashboardActions = (db: DBState) => {
    return callGemini(`Gere 3 ações prioritárias para o dashboard hoteleiro com base no estado atual.`, dashboardActionsSchema);
};

export const generateProfitabilityPlan = (db: DBState) => {
    return callGemini(`Gere um plano de lucratividade para o hotel Forest House Beach considerando o estado atual das reservas (${db.bookings.length} reservas) e quartos (${db.rooms.length} quartos).`, profitabilityPlanSchema);
};

export const simulateExpansion = (query: string, db: DBState) => {
    return callGemini(`Simule o impacto financeiro de adicionar a seguinte expansão ao hotel: "${query}". Estado atual: ${db.rooms.length} quartos.`, expansionSimulationSchema);
};

export const generateImage = async (prompt: string, ...args: any[]) => {
    try {
        const result = await fetch('/api/gemini/generateImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        if (!result.ok) throw new Error("Erro na geração de imagem proxy");
        const json = await result.json();
        return json.dataUrl || null;
    } catch (error) {
        console.error("Gemini Image proxy generation error:", error);
        return null;
    }
};

export const generateCaptionForImage = async (imageUrl: string) => {
    try {
        const base64Data = imageUrl.split(',')[1];
        if (!base64Data) return "Imagem indisponível";

        const result = await fetch('/api/gemini/generateCaption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data })
        });
        
        if (!result.ok) throw new Error("Erro no captioning proxy");
        const json = await result.json();
        return json.text || "Erro ao gerar legenda";
    } catch (error) {
        console.error("Gemini Caption proxy generation error:", error);
        return "Erro ao gerar legenda";
    }
};

export const generatePostTextAndHashtags = async (content: string, property: PropertyInfo, ...args: any[]) => {
    return callGemini(`Gere um post para Instagram sobre: ${content}. Hotel: ${property.name}. Inclua 5 hashtags relevantes em Português.`, {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
};

export const generateManagementReport = (db: DBState, ...args: any[]) => {
    const data = `Reservas: ${db.bookings.length}, Receitas: R$ ${db.transactions.reduce((acc, t) => acc + t.total, 0)}, Despesas: R$ ${db.expenses.reduce((acc, e) => acc + e.amount, 0)}, Taxa de Ocupação: ${Math.round((db.rooms.filter(r => r.status === RoomStatus.OCCUPIED).length / db.rooms.length) * 100)}%`;
    return callGemini(`Gere um relatório gerencial estratégico detalhado baseado nos seguintes dados: ${data}. Idioma: Português (Brasil).`, {
        type: Type.OBJECT,
        properties: {
            financialSummary: {
                type: Type.OBJECT,
                properties: {
                    totalRevenue: { type: Type.NUMBER },
                    totalExpenses: { type: Type.NUMBER },
                    netProfit: { type: Type.NUMBER },
                    keyInsight: { type: Type.STRING }
                }
            },
            projectStatus: {
                type: Type.OBJECT,
                properties: {
                    activeProjects: { type: Type.NUMBER },
                    atRiskProjects: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } } 
                        } 
                    }
                }
            },
            teamPerformance: {
                type: Type.OBJECT,
                properties: {
                    tasksCompleted: { type: Type.NUMBER },
                    topPerformer: { 
                        type: Type.OBJECT, 
                        properties: { name: { type: Type.STRING }, completedTasks: { type: Type.NUMBER } } 
                    },
                    keyInsight: { type: Type.STRING }
                }
            },
            inventoryAlerts: {
                type: Type.OBJECT,
                properties: {
                    lowStockItems: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { name: { type: Type.STRING }, stock: { type: Type.NUMBER } } 
                        } 
                    }
                }
            },
            strategicRecommendations: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { priority: { type: Type.STRING, description: 'Alta, Média or Baixa' }, recommendation: { type: Type.STRING } } 
                } 
            }
        }
    });
};

export const generateDailyItinerary = (guest: Guest, tips: LocalGuideTip[], events: PropertyEvent[], ...args: any[]) => {
    const weather = typeof args[0] === 'string' ? args[0] : 'Ensolarado';
    return callGemini(`Gere um itinerário diário personalizado para o hóspede ${guest.fullName}. Weather: ${weather}. Tips: ${JSON.stringify(tips.slice(0, 3))}. Events: ${JSON.stringify(events.slice(0, 3))}.`, {
        type: Type.OBJECT,
        properties: {
            morning: { type: Type.STRING },
            afternoon: { type: Type.STRING },
            evening: { type: Type.STRING },
            specialTip: { type: Type.STRING }
        }
    });
};

export const generatePersonalizedTip = (guest: Guest, context: string, ...args: any[]) => {
    return callGemini(`Dê uma dica ultra-personalizada para o hóspede ${guest.fullName} baseada no contexto: ${context}.`, {
        type: Type.OBJECT,
        properties: {
            tip: { type: Type.STRING },
            justification: { type: Type.STRING }
        }
    });
};

export const generateIcebreakerSuggestions = (currentUser: Guest | Staff, ...args: any[]) => {
    const name = 'fullName' in currentUser ? currentUser.fullName : (currentUser as Staff).name;
    return callGemini(`Sugira 3 quebra-gelos (perguntas interessantes) para ${name} interagir com outros hóspedes/membros no hostel.`, {
        type: Type.OBJECT,
        properties: {
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
};

export const generatePostFromReview = async (reviewText: string, guestName: string, ...args: any[]) => {
    return callGemini(`Transforme o seguinte review positivo em um post de depoimento para o Instagram: "${reviewText}". Autor: ${guestName}.`, {
        type: Type.OBJECT,
        properties: {
            caption: { type: Type.STRING },
            designSuggestion: { type: Type.STRING }
        }
    });
};

// --- Re-adding missing technical exports ---
export const decideNextOrchestrationAction = (context: any) => callGemini(`Decida a próxima ação baseado em: ${JSON.stringify(context)}`, { type: Type.OBJECT, properties: { action: { type: Type.STRING }, reason: { type: Type.STRING } } });
export const generateVideo = (prompt: string) => Promise.resolve('https://www.w3schools.com/html/mov_bbb.mp4'); // Still mock video
export const generateRemixPrompt = (image: string, mime: string, prompt: string) => callGemini(`Melhore este prompt: ${prompt}`, { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } } }).then(res => res?.prompt || prompt);
export const generateDigitalMenu = (products: any[]) => callGemini(`Gere menu digital`, { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { categoryName: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { productId: { type: Type.STRING } } } } } } });
export const getLatestNewsWithGoogleSearch = async (query: string): Promise<{ text: string; sources: any[] }> => {
    try {
        const response = await fetch('/api/gemini/searchGrounding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        if (!response.ok) throw new Error("Erro na busca do Google Search");
        return await response.json();
    } catch (error) {
        console.error("Google search grounding error:", error);
        return { text: "Erro ao buscar tendências via Google Search.", sources: [] };
    }
};
export const generateMenuPriceAnalysis = (ingredients: any, itemName: string, vibe: string) => callGemini(`Você é um consultor financeiro de restaurantes. Calcule o preço de venda sugerido para o item do cardápio "${itemName}" considerando os seguintes ingredientes e seus custos (em R$): ${JSON.stringify(ingredients)}. O estabelecimento tem a seguinte vibe/posicionamento: "${vibe}". Considere uma margem de lucro de mercado e justifique sua precificação em português.`, { type: Type.OBJECT, properties: { suggestedPrice: { type: Type.NUMBER }, analysis: { type: Type.STRING } } });
export const analyzeSurveillanceImage = (image: string, mimeType?: string, ...args: any[]) => callGemini(`Analise imagem de vigilância com formato ${mimeType || 'image/jpeg'}.`, { type: Type.OBJECT, properties: { anomalies: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const calculateBreakevenPoint = (totalFixedCosts: number, avgDailyRate: number, avgVariableCostPerNight: number, ...args: any[]) => callGemini(`Você é um consultor financeiro de hospitalidade. Calcule o ponto de equilíbrio com base nos seguintes dados: Custos Fixos Totais: R$ ${totalFixedCosts}, Diária Média: R$ ${avgDailyRate}, Custo Variável Média por Noite: R$ ${avgVariableCostPerNight}. Retorne a taxa de ocupação ou meta mínima para lucrar, a receita mensal alvo, e uma breve análise em português.`, { type: Type.OBJECT, properties: { breakevenOccupancyRate: { type: Type.NUMBER }, monthlyRevenueTarget: { type: Type.NUMBER }, analysis: { type: Type.STRING } } });
export const runFinancialScenario = (scenario: string, totalFixedCosts: number, avgDailyRate: number, avgVariableCostPerNight: number, ...args: any[]) => callGemini(`Você é um analista financeiro. Analise o impacto deste cenário hipotético no negócio: "${scenario}". Custos Fixos Atuais: R$ ${totalFixedCosts}, Diária Média: R$ ${avgDailyRate}, Custo Variável Médio por Noite: R$ ${avgVariableCostPerNight}. Forneça o impacto na receita e lucro, listando recomendações e potenciais riscos.`, { type: Type.OBJECT, properties: { scenario: { type: Type.STRING }, impactAnalysis: { type: Type.OBJECT, properties: { profitChange: { type: Type.STRING }, revenueChange: { type: Type.STRING } } }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }, potentialRisks: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const analyzeAndAutoReply = (text: string) => callGemini(`Resposta para: ${text}`, replySuggestionSchema);
export const generateReplySuggestion = (text: string) => callGemini(`Resposta para: ${text}`, replySuggestionSchema);
export const generateAdCampaign = (creatorPlatform: string, creatorGoal: string, creatorContext: string, ...args: any[]) => callGemini(`Gere campanha para plataforma ${creatorPlatform} com objetivo ${creatorGoal} e contexto ${creatorContext}`, { type: Type.OBJECT, properties: { title: { type: Type.STRING }, copy: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const generateDeepCampaignOptimization = (camp: any) => callGemini(`Otimize: ${JSON.stringify(camp)}`, { type: Type.OBJECT, properties: { recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const analyzeAdCreative = (image: string, mimeType?: string, ...args: any[]) => callGemini(`Analise criativo de anúncio com formato ${mimeType || 'image/jpeg'}`, { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } } });
export const spyOnCompetitor = (comp: string) => callGemini(`Espione: ${comp}`, { type: Type.OBJECT, properties: { insights: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const detectCampaignAnomalies = (data: any) => callGemini(`Anomalias em: ${JSON.stringify(data)}`, { type: Type.OBJECT, properties: { anomalies: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const analyzeCampaignPerformance = (adSet: any, campaign: any, ...args: any[]) => callGemini(`Desempenho do conjunto de anúncios: ${JSON.stringify(adSet)} na campanha: ${JSON.stringify(campaign)}`, { type: Type.OBJECT, properties: { insights: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const generateGrowthHubInsights = (data: any) => callGemini(`Gere insights de marketing hoteleiro baseados nestes dados do sistema: ${JSON.stringify(data)}`, growthHubInsightsSchema);
export const generateRecommendedActions = (data: any) => callGemini(`Gere ações de marketing recomendadas baseadas nestes dados do sistema: ${JSON.stringify(data)}`, recommendedActionsSchema);
export const analyzeMarketAndSEO = (data: string) => callGemini(`Mercado e SEO: ${data}`, marketAnalysisLabSchema);
export const spyOnCompetitorAds = (comp: string) => callGemini(`Simule uma espionagem detalhada de anúncios do concorrente: ${comp}`, adSpySchema);
export const generateCreativeAsset = (assetType: string, creativeTopic: string, ...args: any[]) => callGemini(`Gere um ativo criativo de marketing do tipo ${assetType} com foco no tópico: ${creativeTopic}`, creativeAssetSchema);
export const getGrowthHacks = (data: string) => callGemini(`Gere sugestões de táticas de growth hacking inovadoras em resposta a: ${data}`, growthHacksResponseSchema);
export const generateProjectHealthAnalysis = (proj: any, tasks?: any, expenses?: any, ...args: any[]) => callGemini(`Saúde do projeto: ${JSON.stringify(proj)}. Tarefas: ${JSON.stringify(tasks || [])}. Despesas: ${JSON.stringify(expenses || [])}`, { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, issues: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const generateProjectRiskAnalysis = (proj: any, tasks?: any, ...args: any[]) => callGemini(`Riscos do projeto: ${JSON.stringify(proj)}. Tarefas: ${JSON.stringify(tasks || [])}`, { type: Type.ARRAY, items: { type: Type.STRING } });
export const generateTaskDependencies = (desc: string, existingTasks: any, ...args: any[]) => callGemini(`Calcule dependências para a tarefa: "${desc}" considerando estas tarefas existentes: ${JSON.stringify(existingTasks)}`, { type: Type.OBJECT, properties: { dependencies: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const generateProjectShoppingList = (proj: any) => callGemini(`Gere lista de compras detalhada em JSON para o projeto: ${proj.name}. Inclua custo estimado total e itens com nome, quantidade, maxPrice.`, { type: Type.OBJECT, properties: { estimatedTotalCost: { type: Type.NUMBER }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER }, maxPrice: { type: Type.NUMBER }, supplierURL: { type: Type.STRING } } } } } });
export const generateProjectFinancialAnalysis = (proj: any, expenses?: any, ...args: any[]) => callGemini(`Finanças do projeto: ${JSON.stringify(proj)}. Despesas: ${JSON.stringify(expenses || [])}`, { type: Type.OBJECT, properties: { roi: { type: Type.NUMBER }, insights: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const generateProjectWeeklyReport = (proj: any, tasks?: any, expenses?: any, ...args: any[]) => callGemini(`Relatório do projeto: ${JSON.stringify(proj)}. Tarefas: ${JSON.stringify(tasks || [])}. Despesas: ${JSON.stringify(expenses || [])}`, { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, progress: { type: Type.NUMBER } } });
export const generatePersonasAndRoadmaps = (desc: string) => callGemini(`Gere 3 personas para: ${desc}`, { type: Type.ARRAY, items: personaSchema });
export const generateCampaignFromBrief = (goal: string, context: string, platform: string, budget: number) => callGemini(`Crie campanha: ${goal}, ${context}, ${platform}, ${budget}`, { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, recommendedBudget: { type: Type.NUMBER } } } });
export const generateAutomationRules = (goal: string) => callGemini(`Gere regras automação: ${goal}`, { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trigger: { type: Type.STRING }, action: { type: Type.STRING } } } });
export const generateMaintenanceSuggestion = (equip: string) => callGemini(`Manutenção de: ${equip}`, { type: Type.STRING });
export const generateEquipmentInfoSuggestion = (equip: string) => callGemini(`Infos de: ${equip}`, { type: Type.STRING });

// Re-implementing some that were used incorrectly
export const generateEmailContent = (objective: string, property: PropertyInfo) => {
    return callGemini(`Gere um email profissional para: ${objective}. Hotel: ${property.name}. Use placeholders como {{guestName}}. Idioma: Português (Brasil).`, emailContentSchema);
};

export const generateMarketInsights = (location: string, period: string, rawData: string) => {
    return callGemini(`Gere insights de mercado e SEO para um hotel em ${location} no período de ${period}. 
        Dados brutos: ${rawData}`, marketInsightsResponseSchema);
};

export const generatePOSSuggestions = (guest: Guest | null, cart: SaleItem[], products: Product[], atmosphere: string) => {
    const cartItems = cart.map(i => i.name).join(', ');
    const productList = products.slice(0, 10).map(p => `${p.name} (ID: ${p.id})`).join(', ');
    return callGemini(`Com base no carrinho (${cartItems}) e na atmosfera (${atmosphere}), sugira 2 produtos da lista (${productList}) para up-sell.`, posSuggestionSchema);
};

export const generateAIPackageSuggestions = (location: string, insights: MarketInsight[], hostelVibe: string) => {
    return callGemini(`Crie sugestões de pacotes promocionais baseados em insights: ${JSON.stringify(insights)} para um hotel em ${location} com vibe ${hostelVibe}.`, {
        type: Type.OBJECT,
        properties: {
            suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, price: { type: Type.NUMBER } } } }
        }
    });
};

export const generateDynamicPriceSuggestions = (db: DBState, period: string, marketInsights: MarketInsight[]) => {
    return callGemini(`Gere sugestões de preços dinâmicos para o período ${period} com base nos insights: ${JSON.stringify(marketInsights)}. Estado atual: ${JSON.stringify({ bookings: db.bookings.length, occupancy: db.bookings.filter(b => b.status === 'Checked-in').length })}`, {
        type: Type.OBJECT,
        properties: {
            suggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        roomId: { type: Type.NUMBER },
                        newPrice: { type: Type.NUMBER }
                    }
                }
            }
        }
    });
};

// --- Agent Execution Endpoint Call (Sprint 01 & Sprint 02) ---
export const callGeminiAgent = async (agentId: string, prompt: string, schema?: any, systemInstruction?: string, context?: Record<string, any>): Promise<any> => {
    try {
        const response = await fetch('/api/gemini/agent-execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, prompt, schema, systemInstruction, context })
        });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const result = await response.json();
        return result.data ?? result;
    } catch (err: any) {
        console.error(`Error executing agent ${agentId}:`, err);
        return null;
    }
};

// --- Prompt Registry API Interaction Helpers (Sprint 02) ---
export const getPromptRegistryList = async () => {
    try {
        const res = await fetch('/api/prompts');
        const json = await res.json();
        return json.prompts || [];
    } catch (e) {
        console.error('Error fetching prompts from registry:', e);
        return [];
    }
};

export const getPromptRegistryByAgent = async (agentId: string) => {
    try {
        const res = await fetch(`/api/prompts/${agentId}`);
        const json = await res.json();
        return json.prompt || null;
    } catch (e) {
        console.error(`Error fetching prompt for agent ${agentId}:`, e);
        return null;
    }
};

export const updatePromptRegistry = async (agentId: string, systemInstruction: string, name?: string, description?: string) => {
    try {
        const res = await fetch('/api/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId, systemInstruction, name, description })
        });
        const json = await res.json();
        return json.prompt || null;
    } catch (e) {
        console.error('Error updating prompt in registry:', e);
        return null;
    }
};

