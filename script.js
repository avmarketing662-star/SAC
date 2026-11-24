/* SAC | Supermercado Avenida — versão compatível com o HTML enviado */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const STORAGE = "avenida_sac_protocolos_v1";
  const CLIENTS = "avenida_sac_clientes_v1";

  const CITIES = {
    "Camanducaia": ["Camanducaia - Loja 1", "Camanducaia - Loja 2"],
    "Itapeva": ["Itapeva - Loja 1", "Itapeva - Loja 2"],
    "Extrema": ["Extrema - Centro"],
    "Cambuí": ["Cambuí - Centro"]
  };
  const CATEGORIES = [
    "Atendimento", "Açougue", "Padaria", "Hortifruti", "Mercearia",
    "Bebidas", "Limpeza", "Higiene e Perfumaria", "Caixa",
    "Preços e Ofertas", "Produtos", "Estrutura da loja", "Clube Avenida", "Outros"
  ];
  const AGENTS = ["João F", "Lalínia", "Luiz"];
  const STATUSES = ["Aberto", "Em Atendimento", "Resolvido", "Cancelado"];

  const read = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  let protocols = read(STORAGE);
  let clients = read(CLIENTS);
  let charts = {};
  let editingProtocol = null;
  let editingClient = null;

  function Numsidebar(){
    let clientes = document.getElementById("navClients");
    let total = document.getElementById("navTotal");
    clientes.innerHTML =  `<span class="nav-count">${clients.length}</span>`
    total.innerHTML =  `<span class="nav-count">${protocols.length}</span>`

  }
    let clientes = document.getElementById("navClients");
    let total = document.getElementById("navTotal");
    clientes.innerHTML =  `<span class="nav-count">${clients.length}</span>`
    total.innerHTML =  `<span class="nav-count">${protocols.length}</span>`


  const units = () => Object.values(CITIES).flat();
  const uid = (prefix) =>
    `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const norm = (value) => String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const dateFmt = (value) => {
    if (!value) return "—";
    const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
  };

  const dateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };

  const statusClass = (status) => ({
    "Aberto": "status-aberto",
    "Em Atendimento": "status-em-atendimento",
    "Resolvido": "status-resolvido",
    "Cancelado": "status-cancelado"
  }[status] || "");

  const badge = (status) =>
    `<span class="status-badge ${statusClass(status)}">${esc(status || "—")}</span>`;

  function toast(message, type = "success") {
    const container = $("toastContainer");
    if (!container) return;
    const item = document.createElement("div");
    item.style.cssText = [
      "padding:13px 16px", "background:#fff", "border:1px solid #e7edf4",
      `border-left:4px solid ${type === "error" ? "#d64b55" : "#15966b"}`,
      "border-radius:10px", "box-shadow:0 8px 24px #19304f18",
      "font-size:12px", "color:#34465d", "margin-bottom:8px"
    ].join(";");
    item.textContent = message;
    container.appendChild(item);
    window.setTimeout(() => item.remove(), 3500);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(protocols));
      localStorage.setItem(CLIENTS, JSON.stringify(clients));
      return true;
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      toast("Não foi possível salvar. Verifique o armazenamento do navegador.", "error");
      return false;
    }

  }

  function setOptions(id, values, placeholder = "Selecione", keepValue = true) {
    const element = $(id);
    if (!element) return;
    const previous = keepValue ? element.value : "";
    element.innerHTML =
      `<option value="">${esc(placeholder)}</option>` +
      values.map((value) =>
        `<option value="${esc(value)}">${esc(value)}</option>`
      ).join("");
    if (values.includes(previous)) element.value = previous;
  }

  function refreshUnit(cityId, unitId, allWhenEmpty = false) {
    const city = $(cityId)?.value || "";
    const available = city ? (CITIES[city] || []) : (allWhenEmpty ? units() : []);
    const placeholder = city
      ? "Selecione"
      : (allWhenEmpty ? "Todas as unidades" : "Selecione a cidade primeiro");
    setOptions(unitId, available, placeholder);
  }

  function initOptions() {
    setOptions("city", Object.keys(CITIES));
    setOptions("registeredClientCity", Object.keys(CITIES));
    setOptions("category", CATEGORIES);
    setOptions("agent", AGENTS);
    setOptions("filterCity", Object.keys(CITIES), "Todas as cidades");
    setOptions("filterAgent", AGENTS, "Todos os atendentes");
    setOptions("filterCategory", CATEGORIES, "Todas as categorias");
    setOptions("filterStatus", STATUSES, "Todos os status");
    refreshUnit("filterCity", "filterUnit", true);
    refreshUnit("city", "unit");
    refreshUnit("registeredClientCity", "registeredClientUnit");
    setOptions("historyAgent", AGENTS);
  }

  function nextNumber() {
    const year = new Date().getFullYear();
    const sequence = protocols
      .filter((protocol) => String(protocol.number || "").startsWith(`SAC-${year}-`))
      .map((protocol) => Number(String(protocol.number).split("-").pop()))
      .filter(Number.isFinite);
    return `SAC-${year}-${String(Math.max(0, ...sequence) + 1).padStart(5, "0")}`;
  }

  function page(name) {
    const labels = {
      dashboard: "Dashboard", protocolos: "Protocolos", clientes: "Clientes",
      novo: "Novo atendimento", relatorios: "Relatórios"
    };
    document.querySelectorAll(".page").forEach((element) => {
      element.classList.toggle("active", element.id === `page-${name}`);
    });
    document.querySelectorAll(".nav-link").forEach((element) => {
      element.classList.toggle("active", element.dataset.page === name);
    });
    if ($("pageCrumb")) $("pageCrumb").textContent = labels[name] || name;
    $("sidebar")?.classList.remove("open");
    if (name === "dashboard") dashboard();
    if (name === "protocolos") renderProtocols();
    if (name === "clientes") renderClients();
    if (name === "relatorios") report();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProtocolForm() {
    editingProtocol = null;
    $("protocolForm")?.reset();
    if ($("editingId")) $("editingId").value = "";
    if ($("formTitle")) $("formTitle").textContent = "Novo protocolo";
    if ($("protocolNumber")) $("protocolNumber").value = nextNumber();
    if ($("protocolDate")) $("protocolDate").value = dateTime(new Date().toISOString());
    if ($("status")) $("status").value = "Aberto";
    refreshUnit("city", "unit");
  }

  function newProtocol() {
    resetProtocolForm();
    page("novo");
  }

  function formData() {
    return {
      number: $("protocolNumber").value,
      date: editingProtocol?.date || new Date().toISOString(),
      clientName: $("clientName").value.trim(),
      clientPhone: $("clientPhone").value.trim(),
      city: $("city").value,
      unit: $("unit").value,
      channel: $("channel").value,
      manifestation: $("manifestation").value,
      category: $("category").value,
      agent: $("agent").value,
      status: $("status").value,
      description: $("description").value.trim(),
      ratingSAC: $("ratingSAC").value ? Number($("ratingSAC").value) : null,
      ratingMarket: $("ratingMarket").value ? Number($("ratingMarket").value) : null
    };
  }

  function syncClient(protocol) {
    const phone = protocol.clientPhone || "";
    let client = clients.find((item) =>
      norm(item.name) === norm(protocol.clientName) && (item.phone || "") === phone
    );
    if (client) {
      client.city = protocol.city;
      client.unit = protocol.unit;
      client.updatedAt = new Date().toISOString();
    } else {
      clients.push({
        id: uid("cli"), name: protocol.clientName, phone,
        city: protocol.city, unit: protocol.unit, notes: "",
        createdAt: new Date().toISOString()
      });
    }
  }

  function submitProtocol(event) {
    event.preventDefault();
    if (!$("protocolForm").reportValidity()) return;

    const data = formData();
    const now = new Date().toISOString();

    if (editingProtocol) {
      const index = protocols.findIndex((item) => item.id === editingProtocol.id);
      if (index < 0) {
        toast("Não foi possível localizar o protocolo para edição.", "error");
        return;
      }
      const old = protocols[index];
      const history = Array.isArray(old.history) ? old.history : [];
      if (old.status !== data.status) {
        history.push({
          id: uid("hist"), date: now, agent: data.agent, status: data.status,
          description: `Status alterado de "${old.status}" para "${data.status}".`,
          notes: ""
        });
      }
      protocols[index] = { ...old, ...data, history, updatedAt: now };
      toast("Protocolo atualizado com sucesso.");
    } else {
      protocols.unshift({
        id: uid("pro"), ...data, createdAt: now, updatedAt: now,
        history: [{
          id: uid("hist"), date: now, agent: data.agent, status: data.status,
          description: "Protocolo registrado.", notes: ""
        }]
      });
      toast("Protocolo cadastrado com sucesso.");
    }

    syncClient(data);
    if (!save()) return;
    resetProtocolForm();
    renderAll();
    page("protocolos");
    Numsidebar()
  }

  function editProtocol(id) {
    const protocol = protocols.find((item) => item.id === id);
    if (!protocol) return;

    editingProtocol = protocol;
    $("editingId").value = id;
    $("formTitle").textContent = "Editar protocolo";
    $("protocolNumber").value = protocol.number || "";
    $("protocolDate").value = dateTime(protocol.date);
    $("clientName").value = protocol.clientName || "";
    $("clientPhone").value = protocol.clientPhone || "";
    $("city").value = protocol.city || "";
    refreshUnit("city", "unit");
    $("unit").value = protocol.unit || "";
    $("channel").value = protocol.channel || "";
    $("manifestation").value = protocol.manifestation || "";
    $("category").value = protocol.category || "";
    $("agent").value = protocol.agent || "";
    $("status").value = protocol.status || "Aberto";
    $("description").value = protocol.description || "";
    $("ratingSAC").value = protocol.ratingSAC ?? "";
    $("ratingMarket").value = protocol.ratingMarket ?? "";
    page("novo");
  }

  function removeProtocol(id) {
    const protocol = protocols.find((item) => item.id === id);
    if (!protocol || !confirm(`Excluir o protocolo ${protocol.number}? Esta ação não poderá ser desfeita.`)) return;
    protocols = protocols.filter((item) => item.id !== id);
    if (save()) {
      renderAll();
      toast("Protocolo excluído.");
    }
  }

  function openModal(id) { $(id)?.classList.remove("hidden"); }
  function closeModal(id) { $(id)?.classList.add("hidden"); }

  function detailField(label, value) {
    return `<div><label>${esc(label)}</label><p style="margin:7px 0;color:#34465d;font-size:12px;white-space:pre-wrap">${esc(value || "—")}</p></div>`;
  }

  function details(id) {
    const protocol = protocols.find((item) => item.id === id);
    if (!protocol) return;
    $("detailTitle").textContent = protocol.number || "Protocolo";
    $("detailContent").innerHTML = `
      <div class="form-grid">
        ${detailField("Cliente", protocol.clientName)}
        ${detailField("Telefone", protocol.clientPhone)}
        ${detailField("Abertura", dateTime(protocol.date))}
        ${detailField("Unidade", protocol.unit)}
        ${detailField("Cidade", protocol.city)}
        ${detailField("Canal", protocol.channel)}
        ${detailField("Manifestação", protocol.manifestation)}
        ${detailField("Categoria", protocol.category)}
        ${detailField("Atendente", protocol.agent)}
        <div><label>Status</label><p>${badge(protocol.status)}</p></div>
        ${detailField("Nota SAC", protocol.ratingSAC ? `${protocol.ratingSAC}/5` : "Não avaliado")}
        ${detailField("Nota supermercado", protocol.ratingMarket ? `${protocol.ratingMarket}/5` : "Não avaliado")}
        <div class="span-2">${detailField("Descrição", protocol.description)}</div>
      </div>
      <div class="form-footer">
        <span>Atualizado: ${dateTime(protocol.updatedAt || protocol.date)}</span>
        <div>
          <button class="btn btn-outline" data-action="edit-protocol" data-id="${esc(id)}">Editar</button>
          <button class="btn btn-primary" data-action="history-protocol" data-id="${esc(id)}">Histórico</button>
        </div>
      </div>`;
    openModal("detailModal");
  }

  function history(id) {
    const protocol = protocols.find((item) => item.id === id);
    if (!protocol) return;
    $("historyTitle").textContent = `Histórico — ${protocol.number}`;
    $("historyProtocolId").value = id;
    setOptions("historyAgent", AGENTS);
    $("historyAgent").value = protocol.agent || "";

    const entries = (protocol.history || []).slice().sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    $("timeline").innerHTML = entries.map((entry) => `
      <div style="padding:0 0 20px 20px;margin-left:8px;border-left:2px solid #e3edf7">
        <small style="color:#8795a6">${dateTime(entry.date)} · ${esc(entry.agent || "Atendente não informado")}</small>
        <div style="font-weight:700;margin:5px 0;color:#263b54">${esc(entry.description)}</div>
        ${entry.status ? badge(entry.status) : ""}
        ${entry.notes ? `<p style="background:#f6f8fb;padding:9px;border-radius:7px">${esc(entry.notes)}</p>` : ""}
      </div>`).join("") || "<p>Nenhum histórico registrado.</p>";

    $("historyStatus").value = "";
    $("historyDescription").value = "";
    $("historyNotes").value = "";
    openModal("historyModal");
  }

  function addHistory(event) {
    event.preventDefault();
    const protocol = protocols.find((item) => item.id === $("historyProtocolId").value);
    if (!protocol || !$("historyForm").reportValidity()) return;

    const status = $("historyStatus").value;
    const now = new Date().toISOString();
    protocol.history = Array.isArray(protocol.history) ? protocol.history : [];
    protocol.history.push({
      id: uid("hist"), date: now, agent: $("historyAgent").value,
      status: status || protocol.status,
      description: $("historyDescription").value.trim(),
      notes: $("historyNotes").value.trim()
    });
    if (status) protocol.status = status;
    protocol.agent = $("historyAgent").value || protocol.agent;
    protocol.updatedAt = now;

    if (save()) {
      history(protocol.id);
      renderAll();
      toast("Atualização adicionada ao histórico.");
    }
  }

  function filteredProtocols() {
    const query = norm($("searchProtocol")?.value);
    const city = $("filterCity")?.value;
    const unit = $("filterUnit")?.value;
    const agent = $("filterAgent")?.value;
    const status = $("filterStatus")?.value;
    const category = $("filterCategory")?.value;
    const start = $("filterStart")?.value;
    const end = $("filterEnd")?.value;
    const sort = $("sortProtocols")?.value || "newest";

    const result = protocols.filter((protocol) => {
      const day = (protocol.date || "").slice(0, 10);
      return (!query || norm([
        protocol.number, protocol.clientName, protocol.clientPhone
      ].join(" ")).includes(query))
        && (!city || protocol.city === city)
        && (!unit || protocol.unit === unit)
        && (!agent || protocol.agent === agent)
        && (!status || protocol.status === status)
        && (!category || protocol.category === category)
        && (!start || day >= start)
        && (!end || day <= end);
    });

    result.sort((a, b) => {
      if (sort === "oldest") return new Date(a.date) - new Date(b.date);
      if (sort === "name") return (a.clientName || "").localeCompare(b.clientName || "", "pt-BR");
      if (sort === "status") return (a.status || "").localeCompare(b.status || "", "pt-BR");
      return new Date(b.date) - new Date(a.date);
    });
    return result;
  }

  function renderProtocols() {
    const result = filteredProtocols();
    $("protocolCount").textContent = `${result.length} registros encontrados`;
    $("protocolTable").innerHTML = result.map((protocol) => `
      <tr>
        <td><strong>${esc(protocol.number)}</strong></td>
        <td>${dateFmt(protocol.date)}</td>
        <td>${esc(protocol.clientName)}</td>
        <td>${esc(protocol.unit)}</td>
        <td>${esc(protocol.category)}</td>
        <td>${esc(protocol.agent)}</td>
        <td>${badge(protocol.status)}</td>
        <td>
          <button class="icon-button" title="Detalhes" data-action="details" data-id="${esc(protocol.id)}"><i class="fa-regular fa-eye"></i></button>
          <button class="icon-button" title="Histórico" data-action="history" data-id="${esc(protocol.id)}"><i class="fa-solid fa-clock-rotate-left"></i></button>
          <button class="icon-button" title="Editar" data-action="edit-protocol" data-id="${esc(protocol.id)}"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-button" title="Excluir" data-action="delete-protocol" data-id="${esc(protocol.id)}"><i class="fa-regular fa-trash-can"></i></button>
        </td>
      </tr>`).join("");

    $("emptyProtocols")?.classList.toggle("hidden", result.length !== 0);
  }

  function clearFilters() {
    [
      "searchProtocol", "filterCity", "filterUnit", "filterAgent", "filterStatus",
      "filterCategory", "filterStart", "filterEnd"
    ].forEach((id) => { if ($(id)) $(id).value = ""; });
    $("sortProtocols").value = "newest";
    refreshUnit("filterCity", "filterUnit", true);
    renderProtocols();
  }

  function clientForm(client = null) {
    editingClient = client?.id || null;
    $("clientForm").reset();
    $("clientEditingId").value = client?.id || "";
    $("clientFormTitle").textContent = client ? "Editar cliente" : "Cadastrar cliente";

    if (client) {
      $("registeredClientName").value = client.name || "";
      $("registeredClientPhone").value = client.phone || "";
      $("registeredClientCity").value = client.city || "";
      refreshUnit("registeredClientCity", "registeredClientUnit");
      $("registeredClientUnit").value = client.unit || "";
      $("registeredClientNotes").value = client.notes || "";
    } else {
      refreshUnit("registeredClientCity", "registeredClientUnit");
    }

    $("clientFormPanel").classList.remove("hidden");
    $("clientFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });

  }

  function saveClient(event) {
    event.preventDefault();
    if (!$("clientForm").reportValidity()) return;

    const data = {
      name: $("registeredClientName").value.trim(),
      phone: $("registeredClientPhone").value.trim(),
      city: $("registeredClientCity").value,
      unit: $("registeredClientUnit").value,
      notes: $("registeredClientNotes").value.trim(),
      updatedAt: new Date().toISOString()
    };

    if (editingClient) {
      const index = clients.findIndex((client) => client.id === editingClient);
      if (index >= 0) clients[index] = { ...clients[index], ...data };
      toast("Cliente atualizado.");
    } else {
      const duplicate = clients.some((client) =>
        norm(client.name) === norm(data.name) && (client.phone || "") === data.phone
      );
      if (duplicate) {
        toast("Esse cliente já está cadastrado com esse telefone.", "error");
        return;
      }
      clients.push({ id: uid("cli"), ...data, createdAt: new Date().toISOString() });
      toast("Cliente cadastrado.");
    }

    editingClient = null;
    if (save()) {
      $("clientFormPanel").classList.add("hidden");
      renderClients();
    }
    Numsidebar()
  }

  function clientProtocols(client) {
    return protocols.filter((protocol) =>
      norm(protocol.clientName) === norm(client.name)
      && (!client.phone || (protocol.clientPhone || "") === client.phone)
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function renderClients() {
    const query = norm($("searchClient")?.value);
    const result = clients.filter((client) =>
      norm([client.name, client.phone, client.city, client.unit].join(" ")).includes(query)
    ).sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));

    $("clientCount").textContent = `${result.length} clientes`;
    $("clientTable").innerHTML = result.map((client) => {
      const records = clientProtocols(client);
      return `
        <tr>
          <td><strong>${esc(client.name)}</strong></td>
          <td>${esc(client.phone || "—")}</td>
          <td>${esc(client.city || "—")}</td>
          <td>${records.length}</td>
          <td>${records[0] ? dateFmt(records[0].date) : "—"}</td>
          <td>
            <button class="icon-button" title="Histórico" data-action="client-history" data-id="${esc(client.id)}"><i class="fa-solid fa-clock-rotate-left"></i></button>
            <button class="icon-button" title="Editar" data-action="edit-client" data-id="${esc(client.id)}"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-button" title="Excluir" data-action="delete-client" data-id="${esc(client.id)}"><i class="fa-regular fa-trash-can"></i></button>
          </td>
        </tr>`;
    }).join("");

    $("emptyClients")?.classList.toggle("hidden", result.length !== 0);
  }

  function deleteClient(id) {
    const client = clients.find((item) => item.id === id);
    if (!client || !confirm(`Excluir ${client.name}? Os protocolos serão preservados.`)) return;
    clients = clients.filter((item) => item.id !== id);
    if (save()) {
      renderClients();
      toast("Cliente excluído.");
    }
  }

  function clientHistory(id) {
    const client = clients.find((item) => item.id === id);
    if (!client) return;
    const records = clientProtocols(client);

    $("clientHistoryTitle").textContent = `Histórico — ${client.name}`;
    $("clientHistoryContent").innerHTML = `
      <div class="form-grid">
        ${detailField("Telefone", client.phone)}
        ${detailField("Cidade", client.city)}
        ${detailField("Unidade", client.unit)}
        ${detailField("Atendimentos", records.length)}
        <div class="span-2">${detailField("Observações", client.notes)}</div>
      </div>
      <h3>Atendimentos registrados</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>PROTOCOLO</th><th>DATA</th><th>CATEGORIA</th><th>STATUS</th><th></th></tr></thead>
          <tbody>
            ${records.map((protocol) => `
              <tr>
                <td>${esc(protocol.number)}</td>
                <td>${dateFmt(protocol.date)}</td>
                <td>${esc(protocol.category)}</td>
                <td>${badge(protocol.status)}</td>
                <td><button class="btn btn-light btn-sm" data-action="details" data-id="${esc(protocol.id)}">Ver</button></td>
              </tr>`).join("") || '<tr><td colspan="5">Nenhum atendimento.</td></tr>'}
          </tbody>
        </table>
      </div>`;
    openModal("clientHistoryModal");
  }

  function average(values) {
    return values.length
      ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
      : "—";
  }

  function duration(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return "—";
    const minutes = Math.round(milliseconds / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const rest = minutes % 60;
    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${rest}min`;
    return `${Math.max(1, rest)}min`;
  }

  function unitSatisfaction() {
    $("unitSatisfactionTable").innerHTML = units().map((unit) => {
      const records = protocols.filter((protocol) => protocol.unit === unit);
      const sac = records.filter((protocol) => protocol.ratingSAC).map((protocol) => Number(protocol.ratingSAC));
      const market = records.filter((protocol) => protocol.ratingMarket).map((protocol) => Number(protocol.ratingMarket));
      return `<tr>
        <td><strong>${esc(unit)}</strong></td>
        <td>${average(sac)}</td>
        <td>${average(market)}</td>
        <td>${sac.length + market.length}</td>
      </tr>`;
    }).join("");
  }

  function months(count) {
    const labels = [];
    const values = [];
    const now = new Date();
    for (let offset = count - 1; offset >= 0; offset--) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      labels.push(month.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""));
      values.push(protocols.filter((protocol) => {
        const date = new Date(protocol.date);
        return date.getFullYear() === month.getFullYear()
          && date.getMonth() === month.getMonth();
      }).length);
    }
    return { labels, values };
  }

  function ratingMonths(key, count) {
    const labels = [];
    const values = [];
    const now = new Date();
    for (let offset = count - 1; offset >= 0; offset--) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const ratings = protocols.filter((protocol) => {
        const date = new Date(protocol.date);
        return date.getFullYear() === month.getFullYear()
          && date.getMonth() === month.getMonth()
          && protocol[key] !== null && protocol[key] !== undefined && protocol[key] !== "";
      }).map((protocol) => Number(protocol[key]));

      labels.push(month.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""));
      values.push(ratings.length
        ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2))
        : null);
    }
    return { labels, values };
  }

  function drawCharts() {
    if (typeof Chart === "undefined") return;

    const createChart = (id, type, labels, datasets, extraOptions = {}) => {
      const canvas = $(id);
      if (!canvas) return;
      if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
      }

      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: { size: 10 } }
          }
        }
      };

      charts[id] = new Chart(canvas, {
        type,
        data: { labels, datasets },
        options: {
          ...baseOptions,
          ...extraOptions,
          plugins: { ...baseOptions.plugins, ...(extraOptions.plugins || {}) }
        }
      });
    };

    const palette = ["#e69a3a", "#1767bd", "#1a9a70", "#aab5c2"];
    createChart("statusChart", "doughnut", STATUSES, [{
      data: STATUSES.map((status) => protocols.filter((protocol) => protocol.status === status).length),
      backgroundColor: palette, borderWidth: 0, hoverOffset: 5
    }], { cutout: "68%" });

    createChart("unitChart", "bar", units(), [{
      label: "Protocolos",
      data: units().map((unit) => protocols.filter((protocol) => protocol.unit === unit).length),
      backgroundColor: "#1767bd", borderRadius: 5
    }]);

    const categories = [...new Set([
      ...CATEGORIES, ...protocols.map((protocol) => protocol.category).filter(Boolean)
    ])];
    createChart("categoryChart", "bar", categories, [{
      label: "Protocolos",
      data: categories.map((category) => protocols.filter((protocol) => protocol.category === category).length),
      backgroundColor: "#8264ce", borderRadius: 5
    }], { indexAxis: "y" });

    const monthly = months(6);
    createChart("monthlyChart", "line", monthly.labels, [{
      label: "Protocolos",
      data: monthly.values,
      borderColor: "#1767bd",
      backgroundColor: "rgba(23,103,189,.10)",
      fill: true, tension: 0.35
    }]);

    const ratingChart = (id, key, color) => createChart(
      id, "bar",
      ["1 estrela", "2 estrelas", "3 estrelas", "4 estrelas", "5 estrelas"],
      [{
        label: "Avaliações",
        data: [1, 2, 3, 4, 5].map((rating) =>
          protocols.filter((protocol) => Number(protocol[key]) === rating).length
        ),
        backgroundColor: color, borderRadius: 5
      }]
    );

    ratingChart("sacRatingChart", "ratingSAC", "#1767bd");
    ratingChart("marketRatingChart", "ratingMarket", "#1a9a70");

    const sac = ratingMonths("ratingSAC", 6);
    const market = ratingMonths("ratingMarket", 6);
    createChart("satisfactionCompareChart", "bar", sac.labels, [
      { label: "SAC", data: sac.values, backgroundColor: "#1767bd", borderRadius: 4 },
      { label: "Supermercado", data: market.values, backgroundColor: "#1599a5", borderRadius: 4 }
    ], {
      scales: {
        x: { grid: { display: false } },
        y: { min: 0, max: 5, ticks: { stepSize: 1 }, grid: { color: "#edf1f5" } }
      }
    });

    createChart("satisfactionMonthlyChart", "line", sac.labels, [
      { label: "SAC", data: sac.values, borderColor: "#1767bd", tension: 0.3, spanGaps: true },
      { label: "Supermercado", data: market.values, borderColor: "#1599a5", tension: 0.3, spanGaps: true }
    ], {
      scales: {
        x: { grid: { display: false } },
        y: { min: 0, max: 5, ticks: { stepSize: 1 }, grid: { color: "#edf1f5" } }
      }
    });
  }

  function dashboard() {
    const count = (status) => protocols.filter((protocol) => protocol.status === status).length;
    const total = protocols.length;
    const resolved = count("Resolvido");

    $("statTotal").textContent = total;
    $("statOpen").textContent = count("Aberto");
    $("statProgress").textContent = count("Em Atendimento");
    $("statResolved").textContent = resolved;
    $("statCanceled").textContent = count("Cancelado");

    const resolutionTimes = protocols
      .filter((protocol) => protocol.status === "Resolvido" && protocol.date)
      .map((protocol) => {
        const resolutionEntry = (protocol.history || [])
          .filter((entry) => entry.status === "Resolvido")
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        const end = resolutionEntry?.date || protocol.updatedAt;
        return end ? new Date(end) - new Date(protocol.date) : NaN;
      })
      .filter((value) => Number.isFinite(value) && value >= 0);

    $("statAverage").textContent = resolutionTimes.length
      ? duration(resolutionTimes.reduce((sum, value) => sum + value, 0) / resolutionTimes.length)
      : "—";

    const rate = total ? Math.round((resolved / total) * 100) : 0;
    $("resolutionRate").textContent = `${rate}%`;
    $("resolutionBar").style.width = `${rate}%`;

    const sacRatings = protocols.filter((protocol) => protocol.ratingSAC).map((protocol) => Number(protocol.ratingSAC));
    const marketRatings = protocols.filter((protocol) => protocol.ratingMarket).map((protocol) => Number(protocol.ratingMarket));

    $("averageSAC").textContent = average(sacRatings);
    $("totalRatingsSAC").textContent = `${sacRatings.length} avaliações`;
    $("averageMarket").textContent = average(marketRatings);
    $("totalRatingsMarket").textContent = `${marketRatings.length} avaliações`;
    $("positiveSAC").textContent = sacRatings.length
      ? `${Math.round(sacRatings.filter((rating) => rating >= 4).length / sacRatings.length * 100)}%`
      : "0%";
    $("positiveMarket").textContent = marketRatings.length
      ? `${Math.round(marketRatings.filter((rating) => rating >= 4).length / marketRatings.length * 100)}%`
      : "0%";

    const recent = protocols.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);
    $("recentTable").innerHTML = recent.map((protocol) => `
      <tr>
        <td><strong>${esc(protocol.number)}</strong></td>
        <td>${esc(protocol.clientName)}</td>
        <td>${esc(protocol.unit)}</td>
        <td>${esc(protocol.category)}</td>
        <td>${badge(protocol.status)}</td>
        <td><button class="icon-button" data-action="details" data-id="${esc(protocol.id)}" title="Ver detalhes"><i class="fa-regular fa-eye"></i></button></td>
      </tr>`).join("") || '<tr><td colspan="6" style="text-align:center;padding:25px">Nenhum atendimento cadastrado.</td></tr>';

    unitSatisfaction();
    drawCharts();
  }

  function reportData() {
    const type = $("reportType")?.value || "geral";
    const start = $("reportStart")?.value || "";
    const end = $("reportEnd")?.value || "";
    let result = protocols.filter((protocol) => {
      const day = (protocol.date || "").slice(0, 10);
      return (!start || day >= start) && (!end || day <= end);
    });

    if (type === "reclamacoes") result = result.filter((protocol) => protocol.manifestation === "Reclamação");
    if (type === "pendentes") result = result.filter((protocol) =>
      ["Resolvido", "Aberto", "Em Atendimento"].includes(protocol.status)
    );
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function report() {
    const type = $("reportType")?.value || "geral";
    const start = $("reportStart")?.value || "";
    const end = $("reportEnd")?.value || "";
    const result = reportData();

    const titles = {
      geral: "Relatório geral de protocolos",
      unidade: "Relatório por unidade",
      atendente: "Relatório por atendente",
      categoria: "Relatório por categoria",
      reclamacoes: "Relatório de reclamações",
      pendentes: "Relatório de resolvidos e pendentes"
    };
    $("reportTitle").textContent = titles[type] || titles.geral;
    $("reportSubtitle").textContent =
      `Período: ${start ? dateFmt(start) : "início"} até ${end ? dateFmt(end) : "hoje"} · ${result.length} registros`;

    const summary = [
      ["Protocolos", result.length],
      ["Resolvidos", result.filter((protocol) => protocol.status === "Resolvido").length],
      ["Em andamento", result.filter((protocol) => ["Aberto", "Em Atendimento"].includes(protocol.status)).length],
      ["Cancelados", result.filter((protocol) => protocol.status === "Cancelado").length]
    ];
    $("reportSummary").innerHTML = summary.map(([label, value]) => `
      <div class="stat-card"><div><span>${label}</span><strong>${value}</strong><small>Período selecionado</small></div></div>
    `).join("");

    const groupedType = ["unidade", "atendente", "categoria"].includes(type);
    if (groupedType) {
      const field = { unidade: "unit", atendente: "agent", categoria: "category" }[type];
      const groups = [...new Set(result.map((protocol) => protocol[field] || "Não informado"))]
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
      $("reportTable").querySelector("thead").innerHTML =
        "<tr><th>GRUPO</th><th>TOTAL</th><th>ABERTOS</th><th>EM ATENDIMENTO</th><th>RESOLVIDOS</th><th>CANCELADOS</th></tr>";
      $("reportTableBody").innerHTML = groups.map((group) => {
        const items = result.filter((protocol) => (protocol[field] || "Não informado") === group);
        return `<tr>
          <td><strong>${esc(group)}</strong></td>
          <td>${items.length}</td>
          <td>${items.filter((item) => item.status === "Aberto").length}</td>
          <td>${items.filter((item) => item.status === "Em Atendimento").length}</td>
          <td>${items.filter((item) => item.status === "Resolvido").length}</td>
          <td>${items.filter((item) => item.status === "Cancelado").length}</td>
        </tr>`;
      }).join("") || '<tr><td colspan="6">Nenhum registro encontrado.</td></tr>';
    } else {
      $("reportTable").querySelector("thead").innerHTML =
        "<tr><th>PROTOCOLO</th><th>DATA</th><th>CLIENTE</th><th>UNIDADE</th><th>TIPO</th><th>CATEGORIA</th><th>ATENDENTE</th><th>STATUS</th></tr>";
      $("reportTableBody").innerHTML = result.map((protocol) => `
        <tr>
          <td><strong>${esc(protocol.number)}</strong></td>
          <td>${dateFmt(protocol.date)}</td>
          <td>${esc(protocol.clientName)}</td>
          <td>${esc(protocol.unit)}</td>
          <td>${esc(protocol.manifestation)}</td>
          <td>${esc(protocol.category)}</td>
          <td>${esc(protocol.agent)}</td>
          <td>${badge(protocol.status)}</td>
        </tr>`).join("") || '<tr><td colspan="8" style="text-align:center;padding:25px">Nenhum registro encontrado.</td></tr>';
    }
    return result;
  }

  function exportCSV(filename, rows) {
    const content = "\uFEFF" + rows.map((row) =>
      row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(";")
    ).join("\r\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Arquivo CSV exportado.");
  }

  function exportProtocols() {
    const result = filteredProtocols();
    exportCSV("protocolos_sac.csv", [
      ["Protocolo", "Data", "Cliente", "Telefone", "Cidade", "Unidade", "Canal", "Manifestação", "Categoria", "Atendente", "Status", "Nota SAC", "Nota Supermercado", "Descrição"],
      ...result.map((protocol) => [
        protocol.number, dateTime(protocol.date), protocol.clientName, protocol.clientPhone,
        protocol.city, protocol.unit, protocol.channel, protocol.manifestation,
        protocol.category, protocol.agent, protocol.status, protocol.ratingSAC,
        protocol.ratingMarket, protocol.description
      ])
    ]);
  }

  function exportReport() {
    const result = reportData();
    exportCSV("relatorio_sac.csv", [
      ["Protocolo", "Data", "Cliente", "Telefone", "Cidade", "Unidade", "Tipo", "Categoria", "Atendente", "Status", "Nota SAC", "Nota Supermercado", "Descrição"],
      ...result.map((protocol) => [
        protocol.number, dateTime(protocol.date), protocol.clientName, protocol.clientPhone,
        protocol.city, protocol.unit, protocol.manifestation, protocol.category,
        protocol.agent, protocol.status, protocol.ratingSAC, protocol.ratingMarket,
        protocol.description
      ])
    ]);
  }

  function printClient() {
    const content = $("clientHistoryContent")?.innerHTML;
    if (!content) return;
    const popup = window.open("", "_blank");
    if (!popup) {
      toast("Permita pop-ups para imprimir.", "error");
      return;
    }
    popup.document.write(`
      <!doctype html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>Histórico do cliente</title>
      <style>
        body{font:13px Arial,sans-serif;padding:25px;color:#24364b}
        table{width:100%;border-collapse:collapse;margin-top:15px}
        td,th{padding:8px;border:1px solid #ddd;text-align:left}
        th{background:#eef2f7}
        .status-badge{padding:4px 8px;border-radius:20px}
      </style></head><body>
      <h2>Supermercado Avenida — Histórico do cliente</h2>${content}
      </body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  function printPage() {
    window.print();
  }

  function renderAll() {
    dashboard();
    renderProtocols();
    renderClients();
  }

  function handleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (!id) return;

    const actions = {
      details, history, "edit-protocol": editProtocol,
      "delete-protocol": removeProtocol,
      "client-history": clientHistory,
      "edit-client": (clientId) => {
        const client = clients.find((item) => item.id === clientId);
        if (client) clientForm(client);
      },
      "delete-client": deleteClient,
      "history-protocol": (protocolId) => {
        closeModal("detailModal");
        history(protocolId);
      }
    };
    actions[action]?.(id);
  }

  function bind() {
    document.querySelectorAll(".nav-link").forEach((button) => {
      button.addEventListener("click", () => page(button.dataset.page));
    });

    document.querySelectorAll("[data-go]").forEach((button) => {
      button.addEventListener("click", () =>
        button.dataset.go === "novo" ? newProtocol() : page(button.dataset.go)
      );
    });

    document.addEventListener("click", handleAction);

    $("menuToggle")?.addEventListener("click", () => $("sidebar")?.classList.toggle("open"));

    $("city")?.addEventListener("change", () => refreshUnit("city", "unit"));
    $("registeredClientCity")?.addEventListener("change", () =>
      refreshUnit("registeredClientCity", "registeredClientUnit")
    );
    $("filterCity")?.addEventListener("change", () => {
      refreshUnit("filterCity", "filterUnit", true);
      renderProtocols();
    });

    $("protocolForm")?.addEventListener("submit", submitProtocol);
    $("cancelForm")?.addEventListener("click", () => {
      resetProtocolForm();
      page("protocolos");
    });

    $("searchProtocol")?.addEventListener("input", renderProtocols);
    [
      "filterUnit", "filterAgent", "filterStatus", "filterCategory",
      "filterStart", "filterEnd", "sortProtocols"
    ].forEach((id) => $(id)?.addEventListener("change", renderProtocols));
    $("clearFilters")?.addEventListener("click", clearFilters);
    $("exportFiltered")?.addEventListener("click", exportProtocols);

    $("newClientBtn")?.addEventListener("click", () => clientForm());
    $("clientForm")?.addEventListener("submit", saveClient);
    $("cancelClientForm")?.addEventListener("click", () => {
      $("clientFormPanel").classList.add("hidden");
      $("clientForm").reset();
      editingClient = null;
    });
    $("searchClient")?.addEventListener("input", renderClients);

    $("historyForm")?.addEventListener("submit", addHistory);

    ["reportType", "reportStart", "reportEnd"].forEach((id) =>
      $(id)?.addEventListener("change", report)
    );
    $("generateReport")?.addEventListener("click", report);
    $("exportReport")?.addEventListener("click", exportReport);
    $("printReport")?.addEventListener("click", printPage);
    $("printDashboard")?.addEventListener("click", () => {
      page("dashboard");
      window.setTimeout(printPage, 200);
    });
    $("printClientHistory")?.addEventListener("click", printClient);

    document.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => closeModal(button.dataset.close));
    });
    document.querySelectorAll(".modal-backdrop").forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.classList.add("hidden");
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.querySelectorAll(".modal-backdrop").forEach((modal) => modal.classList.add("hidden"));
      }
    });
  }

  // Mantém compatibilidade caso algum botão antigo ainda use onclick="SAC..."
  window.SAC = {
    details, editProtocol, deleteProtocol: removeProtocol, history,
    editClient: (id) => {
      const client = clients.find((item) => item.id === id);
      if (client) clientForm(client);
    },
    deleteClient, clientHistory, closeModal
  };

  document.addEventListener("DOMContentLoaded", () => {
    initOptions();
    bind();

    if ($("todayLabel")) {
      $("todayLabel").textContent = new Date().toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
      });
    }
    if ($("yearNow")) $("yearNow").textContent = new Date().getFullYear();

    resetProtocolForm();
    renderAll();
    report();
  });
})();
/* SAC | Integração de clientes salvos
   Carregue este arquivo DEPOIS do script.js principal.
   Não substitui nem apaga os dados já existentes no localStorage.
*/
(() => {
  "use strict";

  const CLIENTS_KEY = "avenida_sac_clientes_v1";

  const $ = (id) => document.getElementById(id);

  function readClients() {
    try {
      const data = JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Não foi possível ler os clientes salvos:", error);
      return [];
    }
  }

  function ensureClientSelector() {
    const nameInput = $("clientName");
    const formGrid = nameInput?.closest(".form-grid");
    if (!nameInput || !formGrid) return null;

    let selector = $("savedClientSelect");
    if (selector) return selector;

    const label = document.createElement("label");
    label.className = "span-2";
    label.htmlFor = "savedClientSelect";
    label.innerHTML = `
      Cliente já cadastrado
      <select id="savedClientSelect">
        <option value="">Selecione um cliente ou preencha os dados manualmente</option>
      </select>
      <small style="display:block;margin-top:6px;color:#718096;font-size:11px">
        Ao selecionar um cliente, os dados de identificação serão preenchidos automaticamente.
      </small>
    `;

    // Insere o seletor antes do campo de nome, sem alterar o HTML original.
    const nameLabel = nameInput.closest("label");
    if (nameLabel) {
      formGrid.insertBefore(label, nameLabel);
    } else {
      formGrid.prepend(label);
    }

    return $("savedClientSelect");
  }

  function refreshSavedClients() {
    const selector = ensureClientSelector();
    if (!selector) return;

    const clients = readClients()
      .filter((client) => client && client.id && client.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));

    const selectedId = selector.value;
    selector.innerHTML = `
      <option value="">Selecione um cliente ou preencha os dados manualmente</option>
      ${clients.map((client) => {
        const details = [client.phone, client.city].filter(Boolean).join(" · ");
        const label = details ? `${client.name} — ${details}` : client.name;
        return `<option value="${escapeHtml(client.id)}">${escapeHtml(label)}</option>`;
      }).join("")}
    `;

    if (clients.some((client) => String(client.id) === selectedId)) {
      selector.value = selectedId;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function fillProtocolFromClient(clientId) {
    if (!clientId) return;

    const client = readClients().find(
      (item) => String(item.id) === String(clientId)
    );
    if (!client) return;

    if ($("clientName")) $("clientName").value = client.name || "";
    if ($("clientPhone")) $("clientPhone").value = client.phone || "";

    if ($("city")) {
      $("city").value = client.city || "";
      $("city").dispatchEvent(new Event("change", { bubbles: true }));
    }

    if ($("unit")) {
      $("unit").value = client.unit || "";
    }
  }

  function bindClientSelector() {
    const selector = ensureClientSelector();
    if (!selector || selector.dataset.bound === "true") return;

    selector.dataset.bound = "true";
    selector.addEventListener("change", () => {
      fillProtocolFromClient(selector.value);
    });
  }

  function init() {
    bindClientSelector();
    refreshSavedClients();
    Numsidebar()
    // Atualiza a lista depois que um protocolo ou cliente for salvo.
    // O listener principal do SAC é registrado antes deste arquivo.
    $("protocolForm")?.addEventListener("submit", () => {
      window.setTimeout(refreshSavedClients, 0);
    });

    $("clientForm")?.addEventListener("submit", () => {
      window.setTimeout(refreshSavedClients, 0);
    });

    // Atualiza também quando os dados forem alterados em outra aba.
    window.addEventListener("storage", (event) => {
      if (event.key === CLIENTS_KEY) refreshSavedClients();
    });

    // Mantém a lista atualizada ao abrir Novo atendimento.
    document.querySelectorAll('[data-go="novo"], [data-page="novo"]').forEach((button) => {
      button.addEventListener("click", () => {
        window.setTimeout(() => {
          bindClientSelector();
          refreshSavedClients();
        }, 0);
      });
    });
  }

  // O script principal registra seu DOMContentLoaded antes deste complemento.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Disponibiliza atualização manual para futuras personalizações.
  window.SACClientesSalvos = {
    atualizar: refreshSavedClients,
    preencher: fillProtocolFromClient
  };
})();

