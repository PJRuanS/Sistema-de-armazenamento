// ===== PEGANDO ELEMENTOS DO HTML =====
const form = document.getElementById("produtoForm"); 
// Pega o elemento <form> do HTML com id "produtoForm". 
// Isso permite controlar o formulário pelo JS (como capturar quando o usuário clica em enviar).

const nomeInput = document.getElementById("nomeProduto"); 
// Pega o campo de texto do nome do produto.

const precoInput = document.getElementById("precoProduto"); 
// Pega o campo de número do preço do produto.

const tabela = document.getElementById("tabelaProdutos"); 
// Pega o <tbody> da tabela onde os produtos serão exibidos.

const gerarBtn = document.getElementById("gerarBtn"); 
// Pega o botão "Gerar ID" para adicionar um produto.

const gerarPDFBtn = document.getElementById("gerarPDF"); 
// Pega o botão "Exportar PDF".

// ===== RECUPERANDO DADOS DO LOCAL STORAGE =====
let produtos = JSON.parse(localStorage.getItem("produtos")) || []; 
// JSON.parse transforma uma string JSON em objeto JS.
// Se não houver produtos salvos, cria um array vazio.


// ===== FUNÇÃO PARA RENDERIZAR A TABELA =====
function renderTabela() { 
  // Função que pega os produtos do array e transforma em linhas HTML para a tabela
  tabela.innerHTML = produtos
    .map(
      (produto) => `
      <tr>
        <td>${produto.id}</td>
        <td>${produto.nome}</td>
        <td>R$ ${Number(produto.preco).toFixed(2)}</td> 
        <!-- toFixed(2) formata o preço com duas casas decimais -->
        <td><img src="${produto.barcode}" alt="Código de Barras"></td>
        <td><img src="${produto.qrcode}" alt="QR Code"></td>
        <td>
          <button class="edit" onclick="editarProduto(${produto.id})">Editar</button>  
          <button class="delete" onclick="deletarProduto(${produto.id})">Excluir</button> 
        </td>
      </tr>
    `
    )
    .join(""); 
    // .join("") transforma o array de strings em uma única string.

  localStorage.setItem("produtos", JSON.stringify(produtos)); 
  // Salva o array de produtos no localStorage em formato de string para persistir os dados.
}


// ===== FUNÇÃO PARA GERAR CÓDIGOS =====
function gerarCodigo(nome, preco) { 
  // Cria um produto novo com código de barras e QR Code
  const id = Date.now(); 
  // Usa a data e hora atual como um ID único (milissegundos desde 1970)

  // Código de barras
  const canvasBar = document.createElement("canvas"); 
  // Cria um elemento <canvas> temporário no JS (não aparece na tela)
  JsBarcode(canvasBar, id.toString(), { format: "CODE128" }); 
  // Usa a biblioteca JsBarcode para gerar código de barras no canvas
  const barcode = canvasBar.toDataURL("image/png"); 
  // Transforma o conteúdo do canvas em uma imagem em base64 que pode ser exibida no <img>

  // QR Code
  const qrDiv = document.createElement("div"); 
  // Cria uma div temporária para gerar o QR Code
  new QRCode(qrDiv, { text: id.toString(), width: 100, height: 100 }); 
  // Usa a biblioteca QRCodeJS para criar o QR Code do ID do produto

  setTimeout(() => { 
    // Espera 150ms para garantir que o QR Code foi gerado
    const qrImg = qrDiv.querySelector("img").src; 
    // Pega a imagem do QR Code gerado

    produtos.push({ id, nome, preco, barcode, qrcode: qrImg }); 
    // Adiciona o produto no array de produtos

    renderTabela(); 
    // Atualiza a tabela para mostrar o novo produto
  }, 150);
}


// ===== ENVIO DO FORMULÁRIO =====
form.addEventListener("submit", (e) => { 
  // Adiciona um evento que roda quando o usuário envia o formulário
  e.preventDefault(); 
  // Evita que a página recarregue quando clica no botão

  const nome = nomeInput.value.trim(); 
  const preco = precoInput.value.trim(); 
  // Pega os valores digitados nos campos e remove espaços extras

  if (!nome || !preco) {
    return alert("Preencha todos os campos!"); 
    // Se algum campo estiver vazio, mostra alerta e não continua
  }

  const produtoJaExiste = produtos.some( 
    // some() verifica se algum produto já tem o mesmo nome
    (p) => p.nome.toLowerCase() === nome.toLowerCase() 
  );
  if (produtoJaExiste) {
    return alert("Este produto já está cadastrado!");
  }

  gerarCodigo(nome, preco); 
  // Chama a função que cria o produto e gera códigos

  nomeInput.value = ""; 
  precoInput.value = ""; 
  // Limpa os campos do formulário
});

gerarBtn.addEventListener("click", () => { 
  // Quando clica no botão "Gerar ID", dispara o evento de submit do formulário
  form.dispatchEvent(new Event("submit"));
});


// ===== EDITAR PRODUTO =====
function editarProduto(id) { 
  // Função para editar nome e preço de um produto existente
  const produto = produtos.find((p) => p.id === id); 
  // Busca o produto pelo ID

  const novoNome = prompt("Digite o novo nome:", produto.nome); 
  // Pergunta o novo nome
  if (!novoNome)  return;

  const novoPreco = prompt("Digite o novo preço:", produto.preco); 
  // Pergunta o novo preço
  if (!novoPreco) return;

  const jaExiste = produtos.some(
    (p) => p.nome.toLowerCase() === novoNome.toLowerCase() && p.id !== id
  ); 
  // Verifica se já existe outro produto com o mesmo nome

  if (jaExiste) return alert("Já existe um produto com esse nome!");

  produto.nome = novoNome; 
  produto.preco = novoPreco; 
  // Atualiza os valores do produto

  renderTabela(); 
  // Atualiza a tabela para mostrar as alterações
}


// ===== DELETAR PRODUTO =====
function deletarProduto(id) { 
  // Função para excluir um produto
  if (!confirm("Deseja realmente excluir este produto?")) return;
  // Mostra alerta de confirmação

  produtos = produtos.filter((p) => p.id !== id); 
  // Remove o produto do array
  renderTabela(); 
  // Atualiza a tabela
}


// ===== GERAR PDF =====
async function gerarPDF() { 
  // Função para exportar todos os produtos em PDF
  const { jsPDF } = window.jspdf; 
  // Pega a função jsPDF da biblioteca incluída
  const doc = new jsPDF(); 
  // Cria um novo documento PDF

  doc.setFontSize(16); 
  // Define o tamanho da fonte
  doc.text("Relatório de Equipamentos", 60, 15); 
  // Adiciona um título no PDF

  let y = 30; 
  for (const produto of produtos) { 
    // Para cada produto, adiciona informações no PDF
    doc.text(`ID: ${produto.id}`, 10, y);
    doc.text(`Nome: ${produto.nome}`, 10, y + 6);
    doc.text(`Preço: R$ ${Number(produto.preco).toFixed(2)}`, 10, y + 12);

    const imgBar = new Image(); 
    imgBar.src = produto.barcode; 
    // Cria imagem do código de barras

    const imgQR = new Image(); 
    imgQR.src = produto.qrcode; 
    // Cria imagem do QR Code

    await Promise.all([
      new Promise((res) => (imgBar.onload = res)),
      new Promise((res) => (imgQR.onload = res)),
    ]); 
    // Espera as imagens carregarem para adicionar no PDF

    doc.addImage(imgBar, "PNG", 10, y + 18, 60, 20);
    doc.addImage(imgQR, "PNG", 80, y + 15, 25, 25); 
    // Adiciona as imagens no PDF
    y += 50; 
    // Espaçamento entre produtos
  }

  doc.save("equipamentos.pdf"); 
  // Salva o arquivo PDF
}

gerarPDFBtn.addEventListener("click", gerarPDF); 
// Quando clica no botão, chama a função gerarPDF

// ===== INICIALIZA TABELA =====
renderTabela(); 
// Mostra os produtos já salvos ao carregar a página
