import { exec } from 'child_process';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("Configuração do DSN de Sistema no ODBC!");

    // Solicitar informações ao usuário
    const { dsnName, cartorioName, server, database, user, password, iniPath, sgfPath } = await inquirer.prompt([
        {
            type: 'input',
            name: 'dsnName',
            message: 'Digite o nome do DSN (ex: MeuCartório):',
        },
        {
            type: 'input',
            name: 'cartorioName',
            message: 'Digite o nome do cartório (que será usado no arquivo SGF_Multibase.ini):',
        },
        {
            type: 'input',
            name: 'server',
            message: 'Digite o nome do servidor SQL Server (ex: localhost):',
        },
        {
            type: 'input',
            name: 'database',
            message: 'Digite o nome do banco de dados (ex: MinhaBase):',
        },
        {
            type: 'input',
            name: 'user',
            message: 'Digite o usuário do SQL Server:',
        },
        {
            type: 'password',
            name: 'password',
            message: 'Digite a senha do SQL Server:',
            mask: '*',
        },
        {
            type: 'input',
            name: 'iniPath',
            message: 'Digite o caminho completo do arquivo .ini:',
            validate: (input) => {
                if (!fs.existsSync(input)) return "Arquivo não encontrado, tente novamente.";
                if (fs.lstatSync(input).isDirectory()) return "O caminho aponta para um diretório, não um arquivo. Tente novamente.";
                return true;
            },
        },
        {
            type: 'input',
            name: 'sgfPath',
            message: 'Digite o caminho onde o arquivo SGF_Multibase.ini está localizado:',
            validate: (input) => {
                if (!fs.existsSync(input)) return "Caminho inválido ou arquivo não encontrado. Tente novamente.";
                return true;
            },
        },
    ]);

    console.log("Criando DSN no ODBC...");

    // Adicionar entrada no Registro do Windows
    const baseKey = `"HKLM\\SOFTWARE\\ODBC\\ODBC.INI\\${dsnName}"`;
    const commands = [
        `reg add ${baseKey} /v Driver /t REG_SZ /d "SQL Server" /f`,
        `reg add ${baseKey} /v Server /t REG_SZ /d ${server} /f`,
        `reg add ${baseKey} /v Database /t REG_SZ /d ${database} /f`,
        `reg add ${baseKey} /v LastUser /t REG_SZ /d ${user} /f`,
        `reg add ${baseKey} /v Password /t REG_SZ /d ${password} /f`,
        `reg add "HKLM\\SOFTWARE\\ODBC\\ODBC.INI\\ODBC Data Sources" /v ${dsnName} /t REG_SZ /d "SQL Server" /f`,
    ];

    for (const command of commands) {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error("Erro ao executar comando:", command, err.message);
                return;
            }
            console.log(`Executado: ${command}`);
        });
    }

    console.log("DSN configurado com sucesso!");

    // Atualizar o arquivo SGF_Multibase.ini
    const sgfFilePath = path.join(sgfPath, 'SGF_Multibase.ini');
    const iniAbsolutePath = path.resolve(iniPath);
    const sgfEntry = `[${cartorioName}] ${iniAbsolutePath}\n`;

    console.log("Atualizando o arquivo SGF_Multibase.ini...");

    try {
        // Verifica se o arquivo já existe, se não, cria
        if (!fs.existsSync(sgfFilePath)) {
            console.log("Arquivo SGF_Multibase.ini não encontrado. Criando novo arquivo...");
            fs.writeFileSync(sgfFilePath, '', 'utf-8');
        }

        // Adiciona a nova entrada
        fs.appendFileSync(sgfFilePath, sgfEntry, 'utf-8');
        console.log(`Arquivo SGF_Multibase.ini atualizado com sucesso!\nEntrada adicionada: ${sgfEntry}`);
    } catch (err) {
        console.error("Erro ao atualizar o arquivo SGF_Multibase.ini:", err.message);
    }
}

main().catch(console.error);
