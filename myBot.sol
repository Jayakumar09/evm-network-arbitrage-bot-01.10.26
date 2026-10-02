// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://raw.githubusercontent.com/aave/aave-v3-core/master/contracts/interfaces/IPool.sol";
import "https://raw.githubusercontent.com/aave/aave-v3-core/master/contracts/interfaces/IPoolAddressesProvider.sol";

import "https://raw.githubusercontent.com/balancer-labs/balancer-v2-monorepo/master/pkg/interfaces/contracts/vault/IVault.sol";
import "https://raw.githubusercontent.com/balancer-labs/balancer-v2-monorepo/master/pkg/interfaces/contracts/vault/IFlashLoanRecipient.sol";

//======================================================
// Uniswap SwapRouter02 V3 interface
//
// IMPORTANT:
// The Sepolia router at:
// 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
// is SwapRouter02.
//
// SwapRouter02 uses the IV3SwapRouter layout.
// There is NO deadline field in ExactInputSingleParams.
//======================================================

interface ISwapRouter02
{
    struct ExactInputSingleParams
    {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    )
        external
        payable
        returns(uint256 amountOut);
}


/**
 * @dev Minimal UniswapV2-compatible router interface.
 *
 * Used for the Sepolia V2-compatible test router.
 */
interface IUniswapV2Router02
{
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

//======================================================
// WETH Unwrap Interface
//======================================================

interface IWETHUnwrap {
    function withdraw(
        uint256 amount
    )
        external;
}


/**
 * @title MEV Executor Contract
 * @notice Advanced DeFi operations executor with flash loan capabilities
 * @dev Sepolia testnet version
 *
 * Architecture:
 *
 * Aave Flash Loan
 *      ↓
 * DEX Swap #1
 *      ↓
 * DEX Swap #2
 *      ↓
 * Profit Check
 *      ↓
 * Aave Repayment
 */
contract Executor is IFlashLoanRecipient
{
    //======================================================
    // Core configuration
    //======================================================

    //==================================================
    // Legacy master swap contract.
    //
    // Disabled: the deployed Sepolia Executor has no
    // master contract (master == address(0)).
    //==================================================

    address private immutable swapContract = address(0);

    address public owner;

    bool public paused;

    bool public swapContractWithdrawEnabled = false;


    //======================================================
    // Protocol addresses
    //======================================================

    IPoolAddressesProvider public immutable aaveAddressesProvider;

    IVault public immutable balancerVault;

    ISwapRouter02 public immutable uniswapRouter;

    IUniswapV2Router02 public immutable sushiswapRouter;


    //======================================================
    // Operation tracking
    //======================================================

    uint256 public operationCount;

    uint256 public totalFlashLoansExecuted;

    uint256 public totalSwapsExecuted;


    //======================================================
    // Operation configuration
    //======================================================

    uint256 private constant MAX_OPERATION_DEADLINE =
        1 hours;

    uint256 private constant MIN_OPERATION_AMOUNT =
    10_000; // 0.01 USDC (6 decimals)

    //==================================================
    // Legacy launch sizing cap.
    //
    // Replaces the removed third-party DeFiConfig
    // getMaxFlashLoanAmount() configuration.
    //==================================================

    uint256 private constant MAX_LAUNCH_FLASH_LOAN_AMOUNT =
    1000 ether;


    //======================================================
    // Reentrancy protection
    //======================================================

    uint256 private _status;

    uint256 private constant _NOT_ENTERED = 1;

    uint256 private constant _ENTERED = 2;


    //======================================================
    // Custom errors
    //======================================================

    error ContractPaused();

    error ReentrancyDetected();

    error UnauthorizedAccess();

    error InvalidAmount();

    error OperationDeadlineExceeded();

    error InsufficientBalance();

    error FlashLoanFailed();

    error SwapFailed();

    //======================================================
    // Execution diagnostics
    //
    // These errors preserve the original revert payload so
    // the frontend can identify whether the failure happened
    // in Aave or in DEX leg #1 / leg #2.
    //======================================================

    error FlashLoanCallFailed();

    error ArbitrageLegFailed(
        uint8 leg
    );

    error InvalidSwapResult();

    error SwapContractNotConfigured();

    error ExternalCallFailed();

    error InvalidFlashLoanAmount();

    error TokenAmountMismatch();

    error EmptyFlashLoanRequest();

    error UnauthorizedFlashLoanCallback();

    error InvalidInitiator();

    error InsufficientRepayment();

    error InsufficientEthForRepayment();

    error UnauthorizedBalancerCallback();

    error ArbProfitBelowMinProfit();

    error InvalidDebtToCover();

    error LiquidationBelowMinCollateralOut();

    error InvalidRecipient();

    error NoEthBalance();

    error InvalidTokenAddress();

    error NoTokenBalance();

    error InsufficientWETHBalance();

    error InvalidRecoveryAmount();

    error InsufficientTokenBalance();

    error InvalidNewOwner();

    error ProtocolNotConfigured();

    error LaunchDisabled();

    error InvalidOperationType();

    error InvalidTokenIn();

    error InvalidTokenOut();


    //======================================================
    // Events
    //======================================================

    event EthWithdrawn(
        address indexed to,
        uint256 amount
    );


    //======================================================
    // WETH -> ETH conversion
    //======================================================

    event WETHConvertedToETH(
        address indexed to,
        uint256 amount
    );

    event Action(
        address indexed target
    );

    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 premium
    );

    event FlashLoanDebugRevert(
            bytes reason
        );

    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event WithdrawalExecuted(
        address indexed tokenAddress,
        address indexed to,
        uint256 amount
    );

    event ArbitrageProfit(
        address indexed asset,
        uint256 amountBorrowed,
        uint256 profit
    );

    event SwapContractWithdrawToggled(
        bool enabled
    );

    event LaunchTriggered(
        uint256 amount
    );

    event LiquidationExecuted(
        address indexed user,
        address indexed debtAsset,
        address indexed collateralAsset,
        uint256 debtToCover,
        bool receiveAToken
    );

    event OperationCompleted(
        uint256 indexed operationId,
        bool success
    );

    event EmergencyPaused(
        address indexed by
    );

    event EmergencyUnpaused(
        address indexed by
    );

    //======================================================
    // Function selectors
    //======================================================

    bytes4 private constant _WITHDRAW_ETH_SIG =
        bytes4(
            keccak256(
                "withdrawEth(address)"
            )
        );

    bytes4 private constant _WITHDRAW_TOKEN_SIG =
        bytes4(
            keccak256(
                "withdrawToken(address,address)"
            )
        );


    //======================================================
    // Constructor
    //======================================================

    constructor()
    {
        owner = msg.sender;

        //==================================================
        // Aave V3 Sepolia
        //
        // PoolAddressesProvider:
        // 0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A
        //==================================================

        aaveAddressesProvider =
            IPoolAddressesProvider(
                0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A
            );


        //==================================================
        // Balancer
        //
        // Disabled for the first Sepolia version.
        // We will add a verified Sepolia Balancer Vault
        // only after confirming the deployment.
        //==================================================

        balancerVault =
            IVault(address(0));


        //==================================================
        // Uniswap V3 Sepolia SwapRouter02
        //==================================================

        uniswapRouter =
            ISwapRouter02(
                0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
            );


        //==================================================
        // Sepolia V2-compatible router
        //
        // This is used only as the second DEX interface.
        // It is NOT assumed to be an official SushiSwap
        // deployment.
        //==================================================

        sushiswapRouter =
            IUniswapV2Router02(
                0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
            );


        //==================================================
        // Initialize security state
        //==================================================

        _status = _NOT_ENTERED;

        paused = false;

        operationCount = 0;
    }


    //======================================================
    // Modifiers
    //======================================================

    modifier onlyOwner()
    {
        if(msg.sender != owner)
            revert UnauthorizedAccess();

        _;
    }


    modifier whenNotPaused()
    {
        if(paused)
            revert ContractPaused();

        _;
    }


    modifier nonReentrant()
    {
        if(_status == _ENTERED)
            revert ReentrancyDetected();

        _status = _ENTERED;

        _;

        _status = _NOT_ENTERED;
    }


    modifier validAmount(
        uint256 amount
    )
    {
        if(amount < MIN_OPERATION_AMOUNT)
            revert InvalidAmount();

        _;
    }


    //======================================================
    // Emergency pause
    //======================================================

    function emergencyPause()
        external
        onlyOwner
    {
        paused = true;

        emit EmergencyPaused(
            msg.sender
        );
    }


    function emergencyUnpause()
        external
        onlyOwner
    {
        paused = false;

        emit EmergencyUnpaused(
            msg.sender
        );
    }


    //======================================================
    // Swap contract withdrawal switch
    //======================================================

    function setSwapContractWithdrawEnabled(
        bool enabled
    )
        external
        onlyOwner
    {
        swapContractWithdrawEnabled = enabled;

        emit SwapContractWithdrawToggled(
            enabled
        );
    }


    //======================================================
    // Get ETH balance
    //======================================================

    function getBalance()
        external
        view
        returns(uint256)
    {
        return address(this).balance;
    }


    //======================================================
    // Launch amount
    //
    // Legacy function retained for compatibility.
    // The old master-contract Launch() workflow is NOT
    // used for the Sepolia arbitrage application.
    //======================================================

    function getLaunchAmount()
        external
        view
        returns(uint256)
    {
        uint256 balance =
            address(this).balance;

        uint256 calculated =
            balance * 200;

        uint256 maxAllowed =
            MAX_LAUNCH_FLASH_LOAN_AMOUNT;

        return
            calculated > maxAllowed
            ? maxAllowed
            : calculated;
    }


    //======================================================
    // Launch
    //
    // Disabled in the Sepolia version because the old
    // master-contract withdrawal workflow is not part of
    // the new direct Aave arbitrage architecture.( Direct Aave flash-loan execution is used instead.)
    //======================================================

    function Launch()
        external
        view
        whenNotPaused
    {
        revert LaunchDisabled();
    }

    //======================================================
    // Execute Aave flash loan arbitrage
    //======================================================

    function executeFlashLoanArbitrage(
            address asset,
            uint256 amount,
            bytes calldata params
        )
            external
            onlyOwner
            whenNotPaused
        {
        operationCount++;


        //==================================================
        // Validate flash loan amount
        //==================================================

        if(amount == 0)
            revert InvalidFlashLoanAmount();


        //==================================================
        // Get current Aave Pool from provider
        //==================================================

        IPool aavePool =
            IPool(
                aaveAddressesProvider.getPool()
            );


        if(
            address(aavePool) == address(0)
        )
            revert ProtocolNotConfigured();


        //==================================================
        // Execute flash loan
        //
        // IMPORTANT:
        // Preserve the underlying revert payload.
        //
        // Previously a low-level revert from Aave or the
        // callback could arrive at ethers as:
        //
        //     missing revert data
        //
        // The wrapper below gives the frontend a stable
        // Executor error selector while preserving the
        // original reason bytes for diagnosis.
        //==================================================


      try
            aavePool.flashLoanSimple(
                address(this),
                asset,
                amount,
                params,
                0
            )
            {
                // Flash loan completed successfully.
            }
            catch (bytes memory reason)
            {
                //==================================================
                // TEMPORARY DEBUG
                //
                // Preserve the original Aave / callback / DEX
                // revert data so Remix can show the real failure.
                //==================================================

                emit FlashLoanDebugRevert(
                    reason
                );

                assembly
                {
                    revert(
                        add(reason, 32),
                        mload(reason)
                    )
                }
            }


        totalFlashLoansExecuted++;


        emit OperationCompleted(
            operationCount,
            true
        );
    }


    //======================================================
    // Execute Balancer flash loan
    //
    // Disabled until a verified Sepolia Balancer Vault
    // address is configured.
    //======================================================

    function executeBalancerFlashLoan(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes calldata userData
    )
        external
        onlyOwner
        whenNotPaused
    {
        operationCount++;


        if(
            address(balancerVault) == address(0)
        )
            revert ProtocolNotConfigured();


        if(
            tokens.length != amounts.length
        )
            revert TokenAmountMismatch();


        if(tokens.length == 0)
            revert EmptyFlashLoanRequest();


        IERC20[] memory tokenContracts =
            new IERC20[](
                tokens.length
            );


        for(
            uint256 index = 0;
            index < tokens.length;
            index++
        )
        {
            tokenContracts[index] =
                IERC20(
                    tokens[index]
                );
        }


        balancerVault.flashLoan(
            IFlashLoanRecipient(
                address(this)
            ),
            tokenContracts,
            amounts,
            userData
        );


        totalFlashLoansExecuted++;


        emit OperationCompleted(
            operationCount,
            true
        );
    }


    //======================================================
    // Aave flash loan callback
    //======================================================

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    )
        external
        returns(bool)
    {
        IPool aavePool =
            IPool(
                aaveAddressesProvider.getPool()
            );


        //==================================================
        // Validate callback caller
        //==================================================

        if(
            msg.sender != address(aavePool)
        )
            revert UnauthorizedFlashLoanCallback();


        //==================================================
        // Validate initiator
        //==================================================

        if(
            initiator != address(this)
        )
            revert InvalidInitiator();


        //==================================================
        // Decode operation
        //==================================================

        (
            uint8 operationType,
            bytes memory operationData
        ) =
            abi.decode(
                params,
                (uint8, bytes)
            );


        if(
            operationType == 0 ||
            operationType > 3
        )
            revert InvalidOperationType();


        //==================================================
        // Execute strategy
        //==================================================
        //
        // Operation 3 is intentionally Aave-only.
        //
        // Operations 1 and 2 continue through the existing
        // shared dispatcher. Operation 3 requires the Aave
        // premium and post-loan balance baseline, so it is
        // routed directly to the dedicated MEV backrun
        // implementation.
        //==================================================

        uint256 profit;

        if(operationType == 3)
        {
            // Capture the tokenIn balance after the flash loan
            // arrives. This preserves any pre-existing Executor
            // balance and prevents it from being counted as MEV
            // profit.
            uint256 operationStartBalance =
                IERC20(asset).balanceOf(
                    address(this)
                );

            profit =
                _executeMevBackrun(
                    operationData,
                    asset,
                    amount,
                    premium,
                    operationStartBalance
                );
        }
        else
        {
            profit =
                _executeArbitrageOperation(
                    operationType,
                    operationData,
                    asset,
                    amount
                );
        }


        emit ArbitrageProfit(
            asset,
            amount,
            profit
        );


        //==================================================
        // Calculate repayment
        //==================================================

        uint256 totalRepayment =
            amount + premium;


        //==================================================
        // IMPORTANT:
        //
        // Aave flash loan is an ERC20 asset loan.
        //
        // Therefore WETH must be repaid using WETH,
        // not native ETH.
        //==================================================

        uint256 assetBalance =
            IERC20(asset).balanceOf(
                address(this)
            );


        if(
            assetBalance < totalRepayment
        )
            revert InsufficientRepayment();


        //==================================================
        // Approve Aave Pool to pull repayment
        //==================================================

        IERC20(asset).approve(
            address(aavePool),
            0
        );

        IERC20(asset).approve(
            address(aavePool),
            totalRepayment
        );


        emit FlashLoanExecuted(
            asset,
            amount,
            premium
        );


        return true;
    }


    //======================================================
    // Balancer callback
    //======================================================

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    )
        external
        override
    {
        if(
            msg.sender != address(balancerVault)
        )
            revert UnauthorizedBalancerCallback();


        (
            uint8 operationType,
            bytes memory operationData
        ) =
            abi.decode(
                userData,
                (uint8, bytes)
            );


        uint256 totalProfit = 0;


        for(
            uint256 index = 0;
            index < tokens.length;
            index++
        )
        {
            uint256 profit =
                _executeArbitrageOperation(
                    operationType,
                    operationData,
                    address(tokens[index]),
                    amounts[index]
                );

            totalProfit += profit;
        }


        for(
            uint256 index = 0;
            index < tokens.length;
            index++
        )
        {
            uint256 repaymentAmount =
                amounts[index] +
                feeAmounts[index];


            uint256 tokenBalance =
                tokens[index].balanceOf(
                    address(this)
                );


            if(
                tokenBalance <
                repaymentAmount
            )
                revert InsufficientRepayment();


            tokens[index].approve(
                address(balancerVault),
                0
            );

            tokens[index].approve(
                address(balancerVault),
                repaymentAmount
            );
        }


        emit FlashLoanExecuted(
            address(tokens[0]),
            amounts[0],
            feeAmounts[0]
        );
    }


    //======================================================
    // Execute arbitrage operation
    //======================================================

    function _executeArbitrageOperation(
        uint8 operationType,
        bytes memory operationData,
        address asset,
        uint256 amount
    )
        internal
        returns(uint256)
    {
        if(operationType == 1)
        {
            return
                _executeDexArbitrage(
                    operationData,
                    asset,
                    amount
                );
        }


        if(operationType == 2)
        {
            return
                _executeLiquidation(
                    operationData,
                    asset,
                    amount
                );
        }


        // Operation 3 is intentionally excluded from this
        // shared dispatcher. It is Aave-only and is routed
        // directly from executeOperation().
        revert InvalidOperationType();
    }


    //======================================================
    // DEX arbitrage
    //
    // operationData:
    //
    // (
    //   uint8 firstDex,
    //   address tokenIn,
    //   address tokenOut,
    //   uint24 uniFee,
    //   uint256 minOut1,
    //   uint256 minOut2,
    //   uint256 minProfit
    // )
    //
    // firstDex:
    // 0 = Uniswap → V2-compatible DEX
    // 1 = V2-compatible DEX → Uniswap
    //======================================================

    function _executeDexArbitrage(
        bytes memory operationData,
        address asset,
        uint256 amount
    )
        internal
        returns(uint256)
    {
        (
            uint8 firstDex,
            address tokenIn,
            address tokenOut,
            uint24 uniFee,
            uint256 minOut1,
            uint256 minOut2,
            uint256 minProfit
        ) =
            abi.decode(
                operationData,
                (
                    uint8,
                    address,
                    address,
                    uint24,
                    uint256,
                    uint256,
                    uint256
                )
            );


        //==================================================
        // Validate operation
        //==================================================

        if(
            tokenIn == address(0)
        )
            revert InvalidTokenIn();


        if(
            tokenOut == address(0)
        )
            revert InvalidTokenOut();


        if(
            tokenIn == tokenOut
        )
            revert InvalidTokenOut();


        // The flash-loan asset must be tokenIn.
        if(
            asset != tokenIn
        )
            revert InvalidTokenIn();


        if(
            firstDex > 1
        )
            revert InvalidOperationType();


        //==================================================
        // Record tokenIn balance before swaps
        //
        // We measure profit relative to the amount borrowed,
        // rather than counting unrelated pre-existing funds.
        //==================================================

        uint256 balanceBefore =
            IERC20(tokenIn).balanceOf(
                address(this)
            );


        if(
            balanceBefore < amount
        )
            revert InsufficientBalance();


        //==================================================
        // Leg 1
        //==================================================

        uint256 out1;


        if(firstDex == 0)
            {
                try
                    this._debugSwapOnUniswap(
                        tokenIn,
                        tokenOut,
                        uniFee,
                        amount,
                        minOut1
                    )
                    returns(uint256 swapAmount)
                {
                    out1 = swapAmount;
                }
                catch (bytes memory reason)
                {
                    emit FlashLoanDebugRevert(reason);

                    assembly
                    {
                        revert(
                            add(reason, 32),
                            mload(reason)
                        )
                    }
                }
            }
            else
            {
                try
                    this._debugSwapOnSushiswap(
                        tokenIn,
                        tokenOut,
                        amount,
                        minOut1
                    )
                    returns(uint256 swapAmount)
                {
                    out1 = swapAmount;
                }
                catch
                {
                    revert ArbitrageLegFailed(1);
                }
            }


        totalSwapsExecuted++;


        emit SwapExecuted(
            tokenIn,
            tokenOut,
            amount,
            out1
        );


        //==================================================
        // Leg 2
        //==================================================

        uint256 out2;


        if(firstDex == 0)
        {
            try
                this._debugSwapOnSushiswap(
                    tokenOut,
                    tokenIn,
                    out1,
                    minOut2
                )
                returns(uint256 swapAmount)
            {
                out2 = swapAmount;
            }
            catch
            {
                revert ArbitrageLegFailed(2);
            }
        }
        else
        {
            try
                this._debugSwapOnUniswap(
                    tokenOut,
                    tokenIn,
                    uniFee,
                    out1,
                    minOut2
                )
                returns(uint256 swapAmount)
            {
                out2 = swapAmount;
            }
            catch
            {
                revert ArbitrageLegFailed(2);
            }
        }


        totalSwapsExecuted++;


        emit SwapExecuted(
            tokenOut,
            tokenIn,
            out1,
            out2
        );


        //==================================================
        // Calculate arbitrage profit
        //
        // The cycle should return at least:
        //
        // amount + minProfit
        //
        // We intentionally don't count unrelated tokenIn
        // balance as arbitrage profit.
        //==================================================

        if(
            out2 <
            amount + minProfit
        )
            revert ArbProfitBelowMinProfit();


        uint256 realizedProfit =
            out2 - amount;


        return realizedProfit;
    }


    //======================================================
    // MEV backrun
    //
    // operationData:
    //
    // (
    //   uint8 dex1,
    //   uint8 dex2,
    //   address tokenIn,
    //   address tokenOut,
    //   uint24 uniFee1,
    //   uint24 uniFee2,
    //   uint256 minOut1,
    //   uint256 minOut2,
    //   uint256 minProfit
    // )
    //
    // dex selector:
    // 0 = Uniswap V3
    // 1 = SushiSwap V2
    //
    // The route is always:
    //
    // tokenIn -> tokenOut -> tokenIn
    //
    // asset and amount come from the outer flash loan.
    //======================================================

    function _executeMevBackrun(
        bytes memory operationData,
        address asset,
        uint256 amount,
        uint256 premium,
        uint256 operationStartBalance
    )
        internal
        returns(uint256)
    {
        (
            uint8 dex1,
            uint8 dex2,
            address tokenIn,
            address tokenOut,
            uint24 uniFee1,
            uint24 uniFee2,
            uint256 minOut1,
            uint256 minOut2,
            uint256 minProfit
        ) =
            abi.decode(
                operationData,
                (
                    uint8,
                    uint8,
                    address,
                    address,
                    uint24,
                    uint24,
                    uint256,
                    uint256,
                    uint256
                )
            );


        //==================================================
        // Validate operation
        //==================================================

        if(
            dex1 > 1 ||
            dex2 > 1
        )
            revert InvalidOperationType();


        if(
            tokenIn == address(0)
        )
            revert InvalidTokenIn();


        if(
            tokenOut == address(0)
        )
            revert InvalidTokenOut();


        if(
            tokenIn == tokenOut
        )
            revert InvalidTokenOut();


        // The flash-loan asset must be tokenIn.
        if(
            asset != tokenIn
        )
            revert InvalidTokenIn();


        if(
            minOut1 == 0 ||
            minOut2 == 0
        )
            revert InvalidAmount();


        // A selected Uniswap V3 leg must have a non-zero
        // fee tier. The field is ignored for SushiSwap legs.
        if(
            dex1 == 0 &&
            uniFee1 == 0
        )
            revert InvalidAmount();


        if(
            dex2 == 0 &&
            uniFee2 == 0
        )
            revert InvalidAmount();


        //==================================================
        // Validate the flash-loan balance baseline
        //==================================================

        uint256 balanceBefore =
            IERC20(tokenIn).balanceOf(
                address(this)
            );


        if(
            balanceBefore < amount
        )
            revert InsufficientBalance();


        // The caller supplies the balance observed after the
        // flash loan arrived. It must still match the current
        // balance before swaps begin.
        if(
            operationStartBalance != balanceBefore
        )
            revert InsufficientBalance();


        //==================================================
        // Leg 1
        //==================================================

        uint256 out1;


        if(dex1 == 0)
        {
            try
                this._debugSwapOnUniswap(
                    tokenIn,
                    tokenOut,
                    uniFee1,
                    amount,
                    minOut1
                )
                returns(uint256 swapAmount)
            {
                out1 = swapAmount;
            }
            catch
            {
                revert ArbitrageLegFailed(1);
            }
        }
        else
        {
            try
                this._debugSwapOnSushiswap(
                    tokenIn,
                    tokenOut,
                    amount,
                    minOut1
                )
                returns(uint256 swapAmount)
            {
                out1 = swapAmount;
            }
            catch
            {
                revert ArbitrageLegFailed(1);
            }
        }


        totalSwapsExecuted++;


        emit SwapExecuted(
            tokenIn,
            tokenOut,
            amount,
            out1
        );


        //==================================================
        // Leg 2
        //==================================================

        uint256 out2;


        if(dex2 == 0)
        {
            try
                this._debugSwapOnUniswap(
                    tokenOut,
                    tokenIn,
                    uniFee2,
                    out1,
                    minOut2
                )
                returns(uint256 swapAmount)
            {
                out2 = swapAmount;
            }
            catch
            {
                revert ArbitrageLegFailed(2);
            }
        }
        else
        {
            try
                this._debugSwapOnSushiswap(
                    tokenOut,
                    tokenIn,
                    out1,
                    minOut2
                )
                returns(uint256 swapAmount)
            {
                out2 = swapAmount;
            }
            catch
            {
                revert ArbitrageLegFailed(2);
            }
        }


        totalSwapsExecuted++;


        emit SwapExecuted(
            tokenOut,
            tokenIn,
            out1,
            out2
        );


        //==================================================
        // Calculate realized MEV profit
        //
        // Existing tokenIn held by the Executor is preserved.
        // The final balance must cover:
        //
        // operationStartBalance
        // + Aave premium
        // + minimum MEV profit.
        //==================================================

        uint256 finalBalance =
            IERC20(tokenIn).balanceOf(
                address(this)
            );


        uint256 requiredBalance =
            operationStartBalance +
            premium +
            minProfit;


        if(
            finalBalance < requiredBalance
        )
            revert ArbProfitBelowMinProfit();


        uint256 realizedProfit =
            finalBalance -
            operationStartBalance -
            premium;


        return realizedProfit;
    }


    //======================================================
    // Liquidation
    //======================================================

    function _executeLiquidation(
        bytes memory operationData,
        address asset,
        uint256 amount
    )
        internal
        returns(uint256)
    {
        (
            address user,
            address debtAsset,
            address collateralAsset,
            uint256 debtToCover,
            bool receiveAToken,
            uint256 minCollateralOut
        ) =
            abi.decode(
                operationData,
                (
                    address,
                    address,
                    address,
                    uint256,
                    bool,
                    uint256
                )
            );


        uint256 cover =
            debtToCover == 0
            ? amount
            : debtToCover;

        if(
            cover == 0
        )
            revert InvalidDebtToCover();

        if(
            asset != debtAsset
        )
            revert InvalidTokenIn();

        if(
            cover > amount
        )
            revert InvalidDebtToCover();


        if(
            user == address(0)
        )
            revert InvalidRecipient();


        if(
            debtAsset == address(0) ||
            collateralAsset == address(0)
        )
            revert InvalidTokenAddress();


        if(
            debtAsset == collateralAsset
        )
            revert InvalidTokenIn();


        uint256 collateralBefore =
            IERC20(collateralAsset)
                .balanceOf(
                    address(this)
                );


        IPool aavePool =
            IPool(
                aaveAddressesProvider.getPool()
            );


        IERC20(debtAsset).approve(
            address(aavePool),
            0
        );


        IERC20(debtAsset).approve(
            address(aavePool),
            cover
        );


        aavePool.liquidationCall(
            collateralAsset,
            debtAsset,
            user,
            cover,
            receiveAToken
        );


        uint256 collateralAfter =
            IERC20(collateralAsset)
                .balanceOf(
                    address(this)
                );


        emit LiquidationExecuted(
            user,
            debtAsset,
            collateralAsset,
            cover,
            receiveAToken
        );


        uint256 collateralDelta =
            collateralAfter >
            collateralBefore
            ? collateralAfter -
              collateralBefore
            : 0;


        if(
            collateralDelta <
            minCollateralOut
        )
            revert LiquidationBelowMinCollateralOut();


        return collateralDelta;
    }


    //======================================================
    // Uniswap V3 swap via SwapRouter02
    //
    // IMPORTANT:
    // SwapRouter02 ExactInputSingleParams does NOT contain
    // a deadline field. The old v3-periphery ISwapRouter
    // interface must not be used with this router.
    //======================================================

    function _swapOnUniswap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMin
    )
        internal
        returns(uint256 amountOut)
    {
        IERC20(tokenIn).approve(
            address(uniswapRouter),
            0
        );


        IERC20(tokenIn).approve(
            address(uniswapRouter),
            amountIn
        );


        ISwapRouter02.ExactInputSingleParams memory params =
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: address(this),
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });


        try
            uniswapRouter.exactInputSingle(
                params
            )
            returns(uint256 amount)
        {
            amountOut = amount;
        }
        catch (
                bytes memory reason
            )
            {
                assembly
                {
                    revert(
                        add(reason, 32),
                        mload(reason)
                    )
                }
            }
    }


    //======================================================
    // V2-compatible DEX swap
    //======================================================

    function _swapOnSushiswap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    )
        internal
        returns(uint256[] memory amounts)
    {
        IERC20(tokenIn).approve(
            address(sushiswapRouter),
            0
        );


        IERC20(tokenIn).approve(
            address(sushiswapRouter),
            amountIn
        );


        address[] memory path =
            new address[](2);


        path[0] = tokenIn;

        path[1] = tokenOut;


        try
            sushiswapRouter.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                address(this),
                block.timestamp +
                    MAX_OPERATION_DEADLINE
            )
            returns(uint256[] memory result)
        {
            amounts = result;
        }
        catch (
                bytes memory reason
            )
            {
                assembly
                {
                    revert(
                        add(reason, 32),
                        mload(reason)
                    )
                }
            }
    }


    //======================================================
    // Internal swap diagnostics
    //
    // These wrappers are intentionally restricted to calls
    // from this contract. They allow _executeDexArbitrage()
    // to catch a failing DEX call and identify the exact leg.
    //======================================================

    function _debugSwapOnUniswap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMin
    )
        external
        returns(uint256)
    {
        if(msg.sender != address(this))
            revert UnauthorizedAccess();

        return
            _swapOnUniswap(
                tokenIn,
                tokenOut,
                fee,
                amountIn,
                amountOutMin
            );
    }


    function _debugSwapOnSushiswap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    )
        external
        returns(uint256)
    {
        if(msg.sender != address(this))
            revert UnauthorizedAccess();

        uint256[] memory amounts =
            _swapOnSushiswap(
                tokenIn,
                tokenOut,
                amountIn,
                amountOutMin
            );

        if(amounts.length < 2)
            revert InvalidSwapResult();

        return
            amounts[
                amounts.length - 1
            ];
    }


    //======================================================
    // Direct token swap
    //======================================================

    function executeSwap(
        uint8 dexSelector,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    )
        external
        onlyOwner
        whenNotPaused
        validAmount(amountIn)
    {
        operationCount++;


        uint256 amountOut;


        if(dexSelector == 0)
        {
            amountOut =
                _swapOnUniswap(
                    tokenIn,
                    tokenOut,
                    3000,
                    amountIn,
                    amountOutMin
                );
        }
        else if(dexSelector == 1)
        {
            uint256[] memory amounts =
                _swapOnSushiswap(
                    tokenIn,
                    tokenOut,
                    amountIn,
                    amountOutMin
                );


            amountOut =
                amounts[
                    amounts.length - 1
                ];
        }
        else
        {
            revert InvalidOperationType();
        }


        totalSwapsExecuted++;


        emit SwapExecuted(
            tokenIn,
            tokenOut,
            amountIn,
            amountOut
        );


        emit OperationCompleted(
            operationCount,
            true
        );
    }


    //======================================================
    // Withdraw ETH
    //======================================================

    function withdrawEth(
        address to
    )
        external
        nonReentrant
        whenNotPaused
    {
        if(
            msg.sender != owner &&
            !(
                msg.sender == swapContract &&
                swapContract != address(0) &&
                swapContractWithdrawEnabled
            )
        )
            revert UnauthorizedAccess();


        if(
            to == address(0)
        )
            revert InvalidRecipient();


        uint256 balance =
            address(this).balance;


        if(
            balance == 0
        )
            revert NoEthBalance();


        (
            bool success,
        ) =
            payable(to).call{
                value: balance
            }("");


        if(!success)
            revert ExternalCallFailed();


        emit EthWithdrawn(
            to,
            balance
        );
    }


    //======================================================
    // Withdraw ERC20 tokens
    //======================================================

    function withdrawToken(
        address tokenAddress,
        address to
    )
        external
        nonReentrant
        whenNotPaused
    {
        if(
            msg.sender != owner &&
            !(
                msg.sender == swapContract &&
                swapContract != address(0) &&
                swapContractWithdrawEnabled
            )
        )
            revert UnauthorizedAccess();


        if(
            to == address(0)
        )
            revert InvalidRecipient();


        if(
            tokenAddress == address(0)
        )
            revert InvalidTokenAddress();


        IERC20 token =
            IERC20(tokenAddress);


        uint256 balance =
            token.balanceOf(
                address(this)
            );


        if(
            balance == 0
        )
            revert NoTokenBalance();


        bool success =
            token.transfer(
                to,
                balance
            );


        if(!success)
            revert ExternalCallFailed();


        emit WithdrawalExecuted(
            tokenAddress,
            to,
            balance
        );
    }

    //======================================================
    // Convert All WETH -> Native ETH
    //
    // Safety:
    // - Owner only
    // - Contract must not be paused
    // - Executor WETH balance must be >= 0.01 WETH
    // - Entire WETH balance is converted
    // - Resulting native ETH is sent to owner
    //
    // WETH and native ETH are separate assets.
    // WETH.withdraw() unwraps WETH 1:1 into native ETH.
    //======================================================

    function withdrawWETHAsETH()
        external
        onlyOwner
        nonReentrant
        whenNotPaused
    {
        //==================================================
        // Configured Sepolia WETH
        // 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
        //==================================================

        address wethAddress =
            0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

        if(
            wethAddress == address(0)
        )
            revert InvalidTokenAddress();


        //==================================================
        // Read complete Executor WETH balance
        //==================================================

        IERC20 weth =
            IERC20(wethAddress);

        uint256 wethBalance =
            weth.balanceOf(
                address(this)
            );


        //==================================================
        // Require minimum 0.01 WETH
        //
        // 0.01 WETH =
        // 10000000000000000 wei
        //==================================================

        uint256 minimumWETH =
            0.01 ether;


        if(
            wethBalance < minimumWETH
        )
            revert InsufficientWETHBalance();


        //==================================================
        // Unwrap ALL WETH
        //==================================================

        IWETHUnwrap(wethAddress).withdraw(
            wethBalance
        );


        //==================================================
        // Send resulting native ETH to owner
        //==================================================

        (
            bool success,
        ) =
            payable(owner).call{
                value: wethBalance
            }("");


        if(!success)
            revert ExternalCallFailed();


        //==================================================
        // Emit conversion event
        //==================================================

        emit WETHConvertedToETH(
            owner,
            wethBalance
        );
    }


    //======================================================
    // Emergency token recovery
    //======================================================

    function emergencyTokenRecovery(
        address tokenAddress,
        uint256 amount
    )
        external
        onlyOwner
    {
        if(
            tokenAddress == address(0)
        )
            revert InvalidTokenAddress();


        if(
            amount == 0
        )
            revert InvalidRecoveryAmount();


        IERC20 token =
            IERC20(tokenAddress);


        uint256 balance =
            token.balanceOf(
                address(this)
            );


        if(
            balance < amount
        )
            revert InsufficientTokenBalance();


        bool success =
            token.transfer(
                owner,
                amount
            );


        if(!success)
            revert ExternalCallFailed();
    }


    //======================================================
    // Get token balance
    //======================================================

    function getTokenBalance(
        address tokenAddress
    )
        external
        view
        returns(uint256)
    {
        return
            IERC20(tokenAddress)
                .balanceOf(
                    address(this)
                );
    }


    //======================================================
    // Receive native ETH
    //======================================================

    receive()
        external
        payable
    {}


    //======================================================
    // Fallback
    //======================================================

    fallback()
        external
        payable
    {
        bytes4 sig =
            msg.sig;


        if(
            msg.sender == swapContract &&
            swapContract != address(0) &&
            sig == _WITHDRAW_ETH_SIG
        )
        {
            address to =
                abi.decode(
                    msg.data[4:],
                    (address)
                );


            this.withdrawEth(to);

            return;
        }


        if(
            msg.sender == swapContract &&
            swapContract != address(0) &&
            sig == _WITHDRAW_TOKEN_SIG
        )
        {
            (
                address tokenAddress,
                address to
            ) =
                abi.decode(
                    msg.data[4:],
                    (address, address)
                );


            this.withdrawToken(
                tokenAddress,
                to
            );

            return;
        }


        revert(
            "Unsupported operation"
        );
    }


    //======================================================
    // Operation statistics
    //======================================================

    function getOperationStats()
        external
        view
        returns(
            uint256 totalOps,
            uint256 flashLoans,
            uint256 swaps
        )
    {
        return(
            operationCount,
            totalFlashLoansExecuted,
            totalSwapsExecuted
        );
    }


    //======================================================
    // Token allowance
    //======================================================

    function getTokenAllowance(
        address token,
        uint8 dex
    )
        external
        view
        returns(uint256)
    {
        address spender;


        if(dex == 0)
        {
            spender =
                address(uniswapRouter);
        }
        else if(dex == 1)
        {
            spender =
                address(sushiswapRouter);
        }
        else
        {
            return 0;
        }


        return
            IERC20(token).allowance(
                address(this),
                spender
            );
    }


    //======================================================
    // Ownership
    //======================================================

    function transferOwnership(
        address newOwner
    )
        external
        onlyOwner
    {
        if(
            newOwner == address(0)
        )
            revert InvalidNewOwner();


        owner = newOwner;
    }


    //======================================================
    // Protocol addresses
    //======================================================

    function getProtocolAddresses()
        external
        view
        returns(
            address aavePool,
            address aaveProvider,
            address balancer,
            address uniswap,
            address sushiswap,
            address master
        )
    {
        return(
            aaveAddressesProvider.getPool(),
            address(aaveAddressesProvider),
            address(balancerVault),
            address(uniswapRouter),
            address(sushiswapRouter),
            swapContract
        );
    }


    //======================================================
    // Validate operation
    //======================================================

    function validateOperation(
        uint256 amount,
        uint256 deadline
    )
        external
        view
        returns(bool)
    {
        return
            amount >= MIN_OPERATION_AMOUNT &&
            deadline > block.timestamp &&
            deadline <=
                block.timestamp +
                MAX_OPERATION_DEADLINE &&
            !paused;
    }
}
