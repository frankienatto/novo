import React, { useState } from "react";
import {
  DBState,
  CoworkingCheckIn,
  CoworkingDesk,
  CoworkingPlan,
  SaleItem,
  PropertyUnitId,
} from "../../types";
import { Plus, User, Clock, CheckCircle, X, CreditCard, Edit, Trash2, Building2 } from "lucide-react";
import { Section } from "./shared";
import { eventBus } from "../../services/apiService";

interface CoworkingViewProps {
  db: DBState;
  onAddCoworkingCheckIn?: (checkIn: any) => Promise<void>;
  onUpdateCoworkingCheckIn?: (checkInId: string, updates: any) => Promise<void>;
  onSaveCoworkingPlan?: (plan: Omit<CoworkingPlan, 'id'> | CoworkingPlan) => Promise<void>;
  onDeleteCoworkingPlan?: (planId: string) => Promise<void>;
  onSale?: (
    transactionData: any,
    paymentDetails?: any,
  ) => Promise<void>;
}

export const CoworkingView: React.FC<CoworkingViewProps> = ({
  db,
  onAddCoworkingCheckIn,
  onUpdateCoworkingCheckIn,
  onSaveCoworkingPlan,
  onDeleteCoworkingPlan,
  onSale,
}) => {
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<PropertyUnitId | 'all'>('all');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutCheckIn, setCheckoutCheckIn] =
    useState<CoworkingCheckIn | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>("Cartão de Crédito");

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CoworkingPlan | null>(null);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<"hour" | "day" | "month">("hour");
  const [planPrice, setPlanPrice] = useState<number>(0);

  const handleAddPlan = () => {
    setEditingPlan(null);
    setPlanName("");
    setPlanType("hour");
    setPlanPrice(0);
    setIsPlanModalOpen(true);
  };

  const handleEditPlan = (plan: CoworkingPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanType(plan.type);
    setPlanPrice(plan.price);
    setIsPlanModalOpen(true);
  };

  const handleConfirmSavePlan = async () => {
    if (!planName) {
      eventBus.emit("new-toast", {
        type: "error",
        title: "Erro",
        message: "O nome do plano é obrigatório.",
      });
      return;
    }

    if (onSaveCoworkingPlan) {
      await onSaveCoworkingPlan({
        ...(editingPlan ? { id: editingPlan.id } : {}),
        name: planName,
        type: planType,
        price: Number(planPrice),
      });
    }

    eventBus.emit("new-toast", {
      type: "success",
      title: "Sucesso",
      message: editingPlan ? "Plano atualizado com sucesso." : "Plano criado com sucesso.",
    });

    setIsPlanModalOpen(false);
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm("Tem certeza que deseja excluir este plano?")) {
      if (onDeleteCoworkingPlan) {
        await onDeleteCoworkingPlan(planId);
      }
      eventBus.emit("new-toast", {
        type: "success",
        title: "Sucesso",
        message: "Plano excluído.",
      });
    }
  };

  const activeCheckIns =
    db.coworkingCheckIns?.filter((c) => c.status === "Active") || [];

  const handleOpenCheckIn = (deskId: string) => {
    setSelectedDeskId(deskId);
    setGuestName("");
    setSelectedPlanId(db.coworkingPlans?.[0]?.id || "");
    setIsCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = async () => {
    if (!guestName || !selectedPlanId || !selectedDeskId) {
      eventBus.emit("new-toast", {
        type: "error",
        title: "Erro",
        message: "Preencha todos os campos.",
      });
      return;
    }

    if (onAddCoworkingCheckIn) {
      await onAddCoworkingCheckIn({
        deskId: selectedDeskId,
        guestName,
        startTime: new Date().toISOString(),
        planId: selectedPlanId,
        status: "Active",
      });
    }
    eventBus.emit("new-toast", {
      type: "success",
      title: "Check-in Realizado",
      message: `${guestName} agora está na estação.`,
    });
    setIsCheckInModalOpen(false);
  };

  const handleOpenCheckout = (checkin: CoworkingCheckIn) => {
    setCheckoutCheckIn(checkin);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutCheckIn) return;
    const plan = db.coworkingPlans?.find(
      (p) => p.id === checkoutCheckIn.planId,
    );
    const planPrice = plan?.price || 0;
    const consumption =
      checkoutCheckIn.currentItems?.reduce(
        (ac, item) => ac + item.totalPrice,
        0,
      ) || 0;
    const total = planPrice + consumption;

    if (onSale) {
      await onSale({
        items: [
          {
            id: Math.random().toString(),
            productId: plan?.id || "cw-plan",
            name: plan?.name || "Plano Coworking",
            price: planPrice,
            quantity: 1,
            totalPrice: planPrice,
          },
          ...(checkoutCheckIn.currentItems || []),
        ],
        total,
        paymentMethod,
        guestName: checkoutCheckIn.guestName,
      });
    }

    if (onUpdateCoworkingCheckIn) {
      await onUpdateCoworkingCheckIn(checkoutCheckIn.id, {
        status: "Finished",
        endTime: new Date().toISOString(),
      });
    }

    eventBus.emit("new-toast", {
      type: "success",
      title: "Checkout Realizado",
      message: `Pagamento concluído no valor de R$ ${total.toFixed(2)}.`,
    });
    setIsCheckoutModalOpen(false);
    setCheckoutCheckIn(null);
  };

  const filteredDesks = (db.coworkingDesks || []).filter(desk => {
    if (selectedPropertyFilter === 'all') return true;
    const p = desk.propertyId || 'beach';
    return p === selectedPropertyFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Building2 className="text-brand-green" /> Coworking & Espaços
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Gestão de estações de trabalho do Forest House Beach e Santuário</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 gap-1">
          <button onClick={() => setSelectedPropertyFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedPropertyFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🏢 Todas</button>
          <button onClick={() => setSelectedPropertyFilter('beach')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedPropertyFilter === 'beach' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🏖️ Praia</button>
          <button onClick={() => setSelectedPropertyFilter('sanctuary')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedPropertyFilter === 'sanctuary' ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🌿 Santuário</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Estações de Trabalho" icon={Plus}>
          <div className="space-y-4">
            {filteredDesks.map((desk) => {
              const propUnit = desk.propertyId || 'beach';
              return (
              <div
                key={desk.id}
                className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-700">{desk.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${propUnit === 'sanctuary' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {propUnit === 'sanctuary' ? '🌿 Santuário' : '🏖️ Praia'}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${desk.status === "Livre" ? "text-green-500 font-medium" : "text-orange-500 font-medium"}`}
                  >
                    {desk.status}
                  </p>
                </div>
                {desk.status === "Livre" ? (
                  <button
                    onClick={() => handleOpenCheckIn(desk.id)}
                    className="px-4 py-2 bg-brand-primary text-white text-sm rounded-lg hover:bg-brand-primary/90 transition-colors"
                  >
                    Check-in
                  </button>
                ) : (
                  (() => {
                    // Find active checkin for this desk
                    const active = activeCheckIns.find(
                      (c) => c.deskId === desk.id,
                    );
                    return active ? (
                      <button
                        onClick={() => handleOpenCheckout(active)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Ver Comanda e Pagar
                      </button>
                    ) : null;
                  })()
                )}
              </div>
            );
            })}
          </div>
        </Section>
        <Section 
          title="Planos de Acesso" 
          icon={CheckCircle}
          actions={
            <button
              onClick={handleAddPlan}
              className="bg-brand-primary text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 hover:bg-brand-primary/95 transition-all shadow-sm active:scale-95"
            >
              <Plus size={14} /> Novo Plano
            </button>
          }
        >
          <div className="space-y-4">
            {db.coworkingPlans?.map((plan) => (
              <div
                key={plan.id}
                className="p-4 border rounded-xl flex items-center justify-between bg-white shadow-sm hover:border-gray-300 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-700">{plan.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {plan.type === 'hour' ? 'Hora' : plan.type === 'day' ? 'Diário' : plan.type === 'month' ? 'Mensal' : plan.type}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-brand-green">
                    R$ {plan.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-gray-50 rounded cursor-pointer transition-colors"
                      title="Editar Plano"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer transition-colors"
                      title="Excluir Plano"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Check-ins e Comandas Abertas" icon={Clock}>
        {activeCheckIns.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
            Nenhum check-in ativo no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeCheckIns.map((checkin) => {
              const desk = db.coworkingDesks?.find(
                (d) => d.id === checkin.deskId,
              );
              return (
                <div
                  key={checkin.id}
                  className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-800">
                          {checkin.guestName}
                        </p>
                        <p className="text-xs text-gray-500">{desk?.name}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                        Ativo
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-500">Início:</span>{" "}
                        <span>
                          {new Date(checkin.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span className="text-gray-500">Consumo:</span>{" "}
                        <span className="font-semibold">
                          R${" "}
                          {checkin.currentItems
                            ?.reduce((ac, item) => ac + item.totalPrice, 0)
                            .toFixed(2) || "0.00"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        eventBus.emit("new-toast", {
                          type: "info",
                          title: "Integração PDV",
                          message: "Abrir modal de menu/PDV",
                        })
                      }
                      className="flex-1 bg-brand-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90"
                    >
                      Lançar Consumo
                    </button>
                    <button
                      onClick={() => handleOpenCheckout(checkin)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Modal Check-in */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                Novo Check-in Coworking
              </h2>
              <button
                onClick={() => setIsCheckInModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {db.coworkingPlans?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - R$ {p.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleConfirmCheckIn}
                className="w-full bg-brand-green text-white py-2 rounded-md font-bold text-lg hover:bg-brand-green/90 transition-colors"
              >
                Confirmar Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkout */}
      {isCheckoutModalOpen && checkoutCheckIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Checkout</h2>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold text-gray-800">
                  {checkoutCheckIn.guestName}
                </p>
                <div className="flex justify-between text-sm text-gray-600 mt-2 border-b pb-2">
                  <span>
                    Consumo ({checkoutCheckIn.currentItems?.length || 0} itens)
                  </span>
                  <span>
                    R${" "}
                    {checkoutCheckIn.currentItems
                      ?.reduce((ac, item) => ac + item.totalPrice, 0)
                      .toFixed(2) || "0.00"}
                  </span>
                </div>
                {/* Mock plan base price for checkout UI context */}
                <div className="flex justify-between text-sm text-gray-600 mt-2 border-b pb-2">
                  <span>Valor do Plano</span>
                  <span>
                    R${" "}
                    {(
                      db.coworkingPlans?.find(
                        (p) => p.id === checkoutCheckIn.planId,
                      )?.price || 0
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-brand-dark mt-2 pt-2">
                  <span>Total</span>
                  <span>
                    R${" "}
                    {(
                      (db.coworkingPlans?.find(
                        (p) => p.id === checkoutCheckIn.planId,
                      )?.price || 0) +
                      (checkoutCheckIn.currentItems?.reduce(
                        (ac, item) => ac + item.totalPrice,
                        0,
                      ) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option>Cartão de Crédito</option>
                  <option>Cartão de Débito</option>
                  <option>PIX</option>
                  <option>Dinheiro</option>
                </select>
              </div>
              <button
                onClick={handleConfirmCheckout}
                className="w-full bg-brand-green text-white py-2 rounded-md font-bold text-lg hover:bg-brand-green/90 transition-colors flex justify-center items-center gap-2"
              >
                <CreditCard size={20} />
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CRUD Plano de Acesso */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editingPlan ? "Editar Plano de Acesso" : "Novo Plano de Acesso"}
              </h2>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full p-2 border rounded-md outline-none focus:border-brand-primary"
                  placeholder="Ex: Passe Diário, Plano Mensal..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Cobrança
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as any)}
                  className="w-full p-2 border rounded-md capitalize underline-none"
                >
                  <option value="hour">Hora</option>
                  <option value="day">Diário</option>
                  <option value="month">Mensal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  value={planPrice || ""}
                  onChange={(e) => setPlanPrice(Number(e.target.value))}
                  className="w-full p-2 border rounded-md outline-none focus:border-brand-primary"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <button
                onClick={handleConfirmSavePlan}
                className="w-full bg-brand-green text-white py-2 rounded-md font-bold text-lg hover:bg-brand-green/90 transition-colors cursor-pointer"
              >
                Salvar Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
