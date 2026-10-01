// ======================================================
// Transaction History Service
// Frontend Transaction History
// Ethereum Sepolia
//
// IMPORTANT:
// Transaction history is now scoped to:
//
//     Network + Executor + Wallet
//
// This prevents Account 1 and Test Account from sharing
// the same browser localStorage transaction history.
//
// Existing legacy history is migrated ONCE to the
// currently connected wallet.
// ======================================================
import {
  EXECUTOR_CONTRACT_ADDRESS as EXECUTOR_ADDRESS,
} from '../config/contracts'

// ======================================================
// Base Storage Configuration
// ======================================================

const TRANSACTION_HISTORY_BASE_KEY =
  'flashloan_arbitrage_transaction_history'


const TRANSACTION_HISTORY_EVENT =
  'executorTransactionUpdated'



// ======================================================
// Legacy Storage Key
//
// This was the old global transaction-history key:
//
// flashloan_arbitrage_transaction_history
//
// We keep it temporarily so existing transactions are
// not lost during migration.
// ======================================================

const LEGACY_TRANSACTION_HISTORY_KEY =
  TRANSACTION_HISTORY_BASE_KEY


// ======================================================
// Wallet History Migration
// ======================================================

const WALLET_HISTORY_MIGRATION_KEY =
  'flashloan_arbitrage_transaction_history_wallet_v3_migrated'


// ======================================================
// Historical Aave Premium Migration
// ======================================================

const TRANSACTION_HISTORY_MIGRATION_KEY =
  'flashloan_arbitrage_transaction_history_v2_migrated'


// ======================================================
// Transaction Type
// ======================================================

export type TransactionHistoryItem = {

  hash: string

  status:
    | 'SUCCESS'
    | 'FAILED'
    | 'PENDING'

  type:
    | 'ETH_WITHDRAWAL'
    | 'ETH_DEPOSIT'
    | 'ARBITRAGE'
    | 'TOKEN_WITHDRAWAL'

  pair: string

  amount: string

  grossProfit: string

  netProfit: string

  gas: string

  time: string

  from?: string

  to?: string
}


// ======================================================
// Get Current MetaMask Wallet
// ======================================================
//
// We intentionally use selectedAddress first because it
// is synchronously available in MetaMask after connection.
//
// If it is unavailable, we fall back to eth_accounts.
//
// The fallback is synchronous only when MetaMask exposes
// selectedAddress. Otherwise the legacy key is used until
// the wallet becomes available and the page refreshes.
// ======================================================

function getCurrentWalletAddress():
  string | null {

  try {

    const ethereum =
      window.ethereum as
      | {
          selectedAddress?: string | null
        }
      | undefined


    if (
      ethereum?.selectedAddress
    ) {

      return (
        ethereum.selectedAddress
          .toLowerCase()
      )
    }

  } catch (error) {

    console.warn(
      '[TRANSACTION DEBUG] Unable to read MetaMask selected address:',
      error,
    )

  }


  return null
}


// ======================================================
// Get Current Chain ID
// ======================================================

function getCurrentChainId():
  string {

  try {

    const ethereum =
      window.ethereum as
      | {
          chainId?: string
        }
      | undefined


    if (
      ethereum?.chainId
    ) {

      return (
        ethereum.chainId
          .toLowerCase()
      )
    }

  } catch (error) {

    console.warn(
      '[TRANSACTION DEBUG] Unable to read MetaMask chain ID:',
      error,
    )

  }


  // Ethereum Sepolia
  return '0xaa36a7'
}


// ======================================================
// Build Wallet-Scoped Storage Key
// ======================================================
//
// Format:
//
// flashloan_arbitrage_transaction_history
// _chain_<chainId>
// _executor_<executor>
// _wallet_<wallet>
//
// Example:
//
// flashloan_arbitrage_transaction_history
// _chain_0xaa36a7
// _executor_0x33f10323...
// _wallet_0x02cb...
// ======================================================

function getWalletTransactionHistoryKey():
  string | null {

  const wallet =
    getCurrentWalletAddress()


  if (!wallet) {

    return null
  }


  const chainId =
    getCurrentChainId()


  return (
    `${TRANSACTION_HISTORY_BASE_KEY}` +
    `_chain_${chainId}` +
    `_executor_${EXECUTOR_ADDRESS.toLowerCase()}` +
    `_wallet_${wallet}`
  )
}


// ======================================================
// Get Wallet Migration Key
// ======================================================

function getWalletMigrationKey():
  string | null {

  const wallet =
    getCurrentWalletAddress()


  if (!wallet) {

    return null
  }


  return (
    `${WALLET_HISTORY_MIGRATION_KEY}` +
    `_${getCurrentChainId()}` +
    `_${EXECUTOR_ADDRESS.toLowerCase()}` +
    `_${wallet}`
  )
}


// ======================================================
// Read Transactions From Storage Key
// ======================================================

function readTransactionsFromKey(
  storageKey: string,
):
  TransactionHistoryItem[] {

  try {

    const stored =
      localStorage.getItem(
        storageKey,
      )


    if (!stored) {

      return []
    }


    const transactions =
      JSON.parse(
        stored,
      )


    if (
      !Array.isArray(
        transactions,
      )
    ) {

      return []
    }


    return transactions

  } catch (error) {

    console.error(
      '[TRANSACTION DEBUG] Failed to read transaction history:',
      error,
    )


    return []
  }
}


// ======================================================
// Write Transactions To Storage Key
// ======================================================

function writeTransactionsToKey(
  storageKey: string,
  transactions:
    TransactionHistoryItem[],
): void {

  localStorage.setItem(
    storageKey,
    JSON.stringify(
      transactions,
    ),
  )
}


// ======================================================
// Migrate Legacy Global History
// ======================================================
//
// IMPORTANT:
//
// The old application stored history under:
//
// flashloan_arbitrage_transaction_history
//
// We must not lose the existing successful transactions.
//
// The first connected wallet that opens the new version
// receives the legacy history.
//
// After migration, the legacy key is removed so a second
// wallet cannot inherit the same transactions.
//
// This is a ONE-TIME migration.
// ======================================================

function migrateLegacyHistoryToCurrentWallet():
  void {

  try {

    const walletKey =
      getWalletTransactionHistoryKey()


    const migrationKey =
      getWalletMigrationKey()


    if (
      !walletKey ||
      !migrationKey
    ) {

      return
    }


    const alreadyMigrated =
      localStorage.getItem(
        migrationKey,
      )


    if (
      alreadyMigrated ===
      'true'
    ) {

      return
    }


    // --------------------------------------------------
    // If wallet-specific history already exists,
    // simply mark migration complete.
    // --------------------------------------------------

    const walletTransactions =
      readTransactionsFromKey(
        walletKey,
      )


    if (
      walletTransactions.length >
      0
    ) {

      localStorage.setItem(
        migrationKey,
        'true',
      )

      console.log(
        '[TRANSACTION MIGRATION] Wallet history already exists. No legacy migration required.',
      )

      return
    }


    // --------------------------------------------------
    // Read old global history
    // --------------------------------------------------

    const legacyTransactions =
      readTransactionsFromKey(
        LEGACY_TRANSACTION_HISTORY_KEY,
      )


    if (
      legacyTransactions.length ===
      0
    ) {

      localStorage.setItem(
        migrationKey,
        'true',
      )

      return
    }


    // --------------------------------------------------
    // Copy legacy history to the active wallet
    // --------------------------------------------------

    writeTransactionsToKey(
      walletKey,
      legacyTransactions,
    )


    // --------------------------------------------------
    // Mark this wallet migrated
    // --------------------------------------------------

    localStorage.setItem(
      migrationKey,
      'true',
    )


    // --------------------------------------------------
    // Remove legacy global history
    //
    // This prevents another MetaMask account from
    // inheriting Account 1's history.
    // --------------------------------------------------

    localStorage.removeItem(
      LEGACY_TRANSACTION_HISTORY_KEY,
    )


    console.log(
      '[TRANSACTION MIGRATION] Legacy transaction history migrated successfully.',
    )

    console.log(
      '[TRANSACTION MIGRATION] Wallet:',
      getCurrentWalletAddress(),
    )

    console.log(
      '[TRANSACTION MIGRATION] Transactions:',
      legacyTransactions.length,
    )

  } catch (error) {

    console.error(
      '[TRANSACTION MIGRATION] Legacy wallet migration failed:',
      error,
    )

  }
}


// ======================================================
// Get Stored Transactions
// ======================================================

export function getStoredTransactions():
  TransactionHistoryItem[] {

  try {

    // --------------------------------------------------
    // Make sure existing legacy records are migrated
    // before reading the current wallet history.
    // --------------------------------------------------

    migrateLegacyHistoryToCurrentWallet()


    const walletKey =
      getWalletTransactionHistoryKey()


    // --------------------------------------------------
    // Wallet not available
    // --------------------------------------------------

    if (!walletKey) {

      console.warn(
        '[TRANSACTION DEBUG] No connected MetaMask wallet. Returning empty transaction history.',
      )

      return []
    }


    return readTransactionsFromKey(
      walletKey,
    )

  } catch (error) {

    console.error(
      '[TRANSACTION DEBUG] Failed to read wallet transaction history:',
      error,
    )


    return []
  }
}


// ======================================================
// Migrate Historical Transaction Profit
// ======================================================
//
// This function is retained for compatibility with the
// existing application.
//
// The current execution calculation already includes
// Aave flash-loan premium.
//
// Older records may require correction.
// ======================================================

export function migrateHistoricalTransactions():
  void {

  try {

    const transactions =
      getStoredTransactions()


    if (
      transactions.length ===
      0
    ) {

      return
    }


    // --------------------------------------------------
    // Historical corrections from the existing project.
    //
    // Keep only known historical records here.
    // --------------------------------------------------

    const historicalCorrections:
      Record<string, string> = {

      '0xe69ef143205978dd280f740d9fd9c6e6ef842e4ec9ae9d063d5081d22fb3dae8':
        '362.382402',

      '0xb80b254e0bf4a9c9192c5c80167ef2817626d39d5e33e006d600e6b6b18421fe':
        '1.394616',

      '0x3b8321eea8f378a2179726a5a1b5050723727583e8d5359a8af74dfe78922099':
        '1.047571',

      '0x2bd046dcf8e4a5a581d8e14d6d2cc40ef7bf5c99dcb7054d88ac878201244558':
        '1.362494',

      '0x1fa8bff8e871c7c36666a7ab9f88c4e6b4383035525922f6201959840fb7bf68':
        '1.355839',

      '0x858381f9a0b1c2d3e4f506172839405162738495a6b7c8d9e0f1021324354657':
        '3.663765',
    }


    let changed =
      false


    const updatedTransactions =
      transactions.map(
        (
          transaction,
        ) => {

          const hash =
            transaction.hash.toLowerCase()


          const correctedNetProfit =
            historicalCorrections[
              hash
            ]


          if (
            correctedNetProfit ===
            undefined
          ) {

            return transaction
          }


          if (
            transaction.netProfit ===
            correctedNetProfit
          ) {

            return transaction
          }


          changed =
            true


          console.log(
            '[TRANSACTION MIGRATION] Correcting historical transaction:',
            hash,
          )


          return {
            ...transaction,

            netProfit:
              correctedNetProfit,
          }
        },
      )


    if (
      !changed
    ) {

      return
    }


    const walletKey =
      getWalletTransactionHistoryKey()


    if (!walletKey) {

      return
    }


    writeTransactionsToKey(
      walletKey,
      updatedTransactions,
    )


    window.dispatchEvent(
      new CustomEvent(
        TRANSACTION_HISTORY_EVENT,
      ),
    )


    console.log(
      '[TRANSACTION MIGRATION] Historical transaction correction completed.',
    )

  } catch (error) {

    console.error(
      '[TRANSACTION MIGRATION] Historical transaction migration failed:',
      error,
    )
  }
}


// ======================================================
// Migrate Historical Aave Premium
// ======================================================
//
// IMPORTANT:
//
// Existing application already corrected the historical
// Aave premium values.
//
// We keep this function because TransactionsPage imports
// and calls it.
//
// It is deliberately conservative:
//
// - only ARBITRAGE records
// - never modifies the latest known corrected record
// - only subtracts the historical Aave premium
// - runs once
// ======================================================

const LATEST_CORRECT_TRANSACTION =
  '0x18357f25589eb5bf1bffa7d11c0e0d8492fbf64095b8e713c554b001f7255694'


export function migrateHistoricalAavePremium():
  void {

  try {

    const alreadyMigrated =
      localStorage.getItem(
        TRANSACTION_HISTORY_MIGRATION_KEY,
      )


    if (
      alreadyMigrated ===
      'true'
    ) {

      return
    }


    const transactions =
      getStoredTransactions()


    if (
      transactions.length ===
      0
    ) {

      return
    }


    let changed =
      false


    const updatedTransactions =
      transactions.map(
        (
          transaction,
        ) => {

          // --------------------------------------------
          // Never modify the newest already-correct
          // transaction.
          // --------------------------------------------

          if (
            transaction.hash.toLowerCase() ===
            LATEST_CORRECT_TRANSACTION.toLowerCase()
          ) {

            return transaction
          }


          // --------------------------------------------
          // Only arbitrage transactions are affected.
          // --------------------------------------------

          if (
            transaction.type !==
            'ARBITRAGE'
          ) {

            return transaction
          }


          const amount =
            Number(
              transaction.amount,
            )


          if (
            !Number.isFinite(
              amount,
            )
          ) {

            return transaction
          }


          // --------------------------------------------
          // Existing project assumption:
          //
          // Aave premium = 0.05% of flash-loan amount
          //
          // 100 USDC -> 0.05 USDC
          //   1 USDC -> 0.0005 USDC
          // --------------------------------------------

          const premium =
            amount *
            0.0005


          if (
            premium <=
            0
          ) {

            return transaction
          }


          const oldNetProfit =
            Number(
              transaction.netProfit,
            )


          if (
            !Number.isFinite(
              oldNetProfit,
            )
          ) {

            return transaction
          }


          const newNetProfit =
            oldNetProfit -
            premium


          changed =
            true


          console.log(
            '========================================',
          )

          console.log(
            '[TRANSACTION MIGRATION] Correcting transaction:',
            transaction.hash,
          )

          console.log(
            '[TRANSACTION MIGRATION] Amount:',
            amount,
          )

          console.log(
            '[TRANSACTION MIGRATION] Aave premium:',
            premium,
          )

          console.log(
            '[TRANSACTION MIGRATION] Old net profit:',
            transaction.netProfit,
          )

          console.log(
            '[TRANSACTION MIGRATION] New net profit:',
            newNetProfit.toFixed(6),
          )

          console.log(
            '========================================',
          )


          return {
            ...transaction,

            netProfit:
              newNetProfit.toFixed(
                6,
              ),
          }
        },
      )


    if (
      changed
    ) {

      const walletKey =
        getWalletTransactionHistoryKey()


      if (
        walletKey
      ) {

        writeTransactionsToKey(
          walletKey,
          updatedTransactions,
        )


        window.dispatchEvent(
          new CustomEvent(
            TRANSACTION_HISTORY_EVENT,
          ),
        )


        console.log(
          '[TRANSACTION MIGRATION] Historical Aave premium correction completed.',
        )
      }
    }


    localStorage.setItem(
      TRANSACTION_HISTORY_MIGRATION_KEY,
      'true',
    )


    console.log(
      '[TRANSACTION MIGRATION] Aave premium migration completed.',
    )

  } catch (error) {

    console.error(
      '[TRANSACTION MIGRATION] Failed:',
      error,
    )
  }
}


// ======================================================
// Save Transaction
// ======================================================

export function saveTransaction(
  transaction:
    TransactionHistoryItem,
): void {

  try {

    const walletKey =
      getWalletTransactionHistoryKey()


    // --------------------------------------------------
    // Never save a transaction without a wallet.
    // --------------------------------------------------

    if (!walletKey) {

      console.error(
        '[TRANSACTION DEBUG] Cannot save transaction: no connected MetaMask wallet.',
      )

      return
    }


    const existingTransactions =
      getStoredTransactions()


    // --------------------------------------------------
    // Prevent duplicate transaction hashes
    // --------------------------------------------------

    const alreadyExists =
      existingTransactions.some(
        (
          item,
        ) =>
          item.hash.toLowerCase() ===
          transaction.hash.toLowerCase(),
      )


    if (
      alreadyExists
    ) {

      console.log(
        '[TRANSACTION DEBUG] Transaction already exists:',
        transaction.hash,
      )

      return
    }


    const updatedTransactions = [
      transaction,
      ...existingTransactions,
    ]


    // --------------------------------------------------
    // Save to wallet-specific storage
    // --------------------------------------------------

    writeTransactionsToKey(
      walletKey,
      updatedTransactions,
    )


    // --------------------------------------------------
    // Notify TransactionsPage in the same browser tab
    // --------------------------------------------------

    window.dispatchEvent(
      new CustomEvent(
        TRANSACTION_HISTORY_EVENT,
      ),
    )


    console.log(
      '[TRANSACTION DEBUG] Transaction saved:',
      transaction,
    )

    console.log(
      '[TRANSACTION DEBUG] Wallet:',
      getCurrentWalletAddress(),
    )

    console.log(
      '[TRANSACTION DEBUG] Storage key:',
      walletKey,
    )

    console.log(
      '[TRANSACTION DEBUG] Total stored transactions:',
      updatedTransactions.length,
    )

  } catch (error) {

    console.error(
      '[TRANSACTION DEBUG] Failed to save transaction:',
      error,
    )
  }
}


// ======================================================
// Subscribe To Transaction Updates
// ======================================================

export function subscribeToTransactionUpdates(
  callback: () => void,
): () => void {

  const handleTransactionUpdate =
    () => {

      console.log(
        '[TRANSACTION DEBUG] Local transaction update received.',
      )

      callback()
    }


  const handleStorageChange =
    (
      event: StorageEvent,
    ) => {

      // ------------------------------------------------
      // Only respond to our transaction-history keys.
      // ------------------------------------------------

      if (
        !event.key
      ) {

        return
      }


      const currentWalletKey =
        getWalletTransactionHistoryKey()


      if (
        event.key ===
        currentWalletKey
      ) {

        console.log(
          '[TRANSACTION DEBUG] Cross-tab transaction update received.',
        )

        callback()
      }
    }


  // ----------------------------------------------------
  // Same-tab custom event
  // ----------------------------------------------------

  window.addEventListener(
    TRANSACTION_HISTORY_EVENT,
    handleTransactionUpdate,
  )


  // ----------------------------------------------------
  // Cross-tab storage event
  // ----------------------------------------------------

  window.addEventListener(
    'storage',
    handleStorageChange,
  )


  // ====================================================
  // Cleanup
  // ====================================================

  return () => {

    console.log(
      '[TRANSACTION DEBUG] Transaction history subscription cleanup.',
    )


    window.removeEventListener(
      TRANSACTION_HISTORY_EVENT,
      handleTransactionUpdate,
    )


    window.removeEventListener(
      'storage',
      handleStorageChange,
    )
  }
}