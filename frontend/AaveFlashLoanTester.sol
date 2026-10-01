// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://raw.githubusercontent.com/aave/aave-v3-core/master/contracts/interfaces/IPool.sol";
import "https://raw.githubusercontent.com/aave/aave-v3-core/master/contracts/interfaces/IPoolAddressesProvider.sol";
import "https://raw.githubusercontent.com/aave/aave-v3-core/master/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";

/**
 * @title AaveFlashLoanTester
 * @notice Minimal diagnostic contract for testing Aave V3
 *         flashLoanSimple() on Ethereum Sepolia.
 *
 * IMPORTANT:
 * This contract intentionally does NOT perform:
 *
 * - Uniswap swaps
 * - V2-compatible swaps
 * - arbitrage
 * - profit calculations
 *
 * It is only used to determine whether the Aave flash-loan
 * itself works with the selected asset and amount.
 */
contract AaveFlashLoanTester
    is IFlashLoanSimpleReceiver
{
    //======================================================
    // Sepolia Aave V3
    //
    // Same PoolAddressesProvider used by the current
    // Executor contract.
    //======================================================

    IPoolAddressesProvider public immutable
        aaveAddressesProvider;


    //======================================================
    // Owner
    //======================================================

    address public owner;


    //======================================================
    // Test statistics
    //======================================================

    uint256 public testCount;

    uint256 public lastAmount;

    uint256 public lastPremium;

    address public lastAsset;


    //======================================================
    // Events
    //======================================================

    event FlashLoanTestStarted(
        address indexed asset,
        uint256 amount
    );

    event FlashLoanTestCompleted(
        address indexed asset,
        uint256 amount,
        uint256 premium
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );


    //======================================================
    // Errors
    //======================================================

    error Unauthorized();

    error InvalidAsset();

    error InvalidAmount();

    error InvalidCallbackCaller();

    error InvalidInitiator();

    error InsufficientRepayment();

    error TransferFailed();


    //======================================================
    // Constructor
    //======================================================

    constructor()
    {
        owner = msg.sender;

        aaveAddressesProvider =
            IPoolAddressesProvider(
                0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A
            );

        testCount = 0;
    }


    //======================================================
    // Owner modifier
    //======================================================

    modifier onlyOwner()
    {
        if(msg.sender != owner)
            revert Unauthorized();

        _;
    }


    //======================================================
    // Execute simple Aave flash-loan test
    //
    // This function does NOTHING except:
    //
    // 1. Get the current Aave Pool.
    // 2. Request flash loan.
    // 3. Receive callback.
    // 4. Check repayment.
    // 5. Approve repayment.
    //
    // No DEX is involved.
    //======================================================

    function testFlashLoan(
        address asset,
        uint256 amount
    )
        external
        onlyOwner
    {
        if(asset == address(0))
            revert InvalidAsset();

        if(amount == 0)
            revert InvalidAmount();

        IPool aavePool =
            IPool(
                aaveAddressesProvider.getPool()
            );

        if(address(aavePool) == address(0))
            revert InvalidAsset();

        testCount++;

        lastAsset = asset;

        lastAmount = amount;

        emit FlashLoanTestStarted(
            asset,
            amount
        );

        //==================================================
        // Request Aave flash loan
        //==================================================

        aavePool.flashLoanSimple(
            address(this),
            asset,
            amount,
            "",
            0
        );
    }


    //======================================================
    // Aave flash-loan callback
    //======================================================

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata
    )
        external
        override
        returns(bool)
    {
        IPool aavePool =
            IPool(
                aaveAddressesProvider.getPool()
            );


        //==================================================
        // Verify callback came from Aave
        //==================================================

        if(msg.sender != address(aavePool))
            revert InvalidCallbackCaller();


        //==================================================
        // Verify initiator
        //==================================================

        if(initiator != address(this))
            revert InvalidInitiator();


        //==================================================
        // Calculate repayment
        //==================================================

        uint256 totalRepayment =
            amount + premium;


        //==================================================
        // Check that this tester has enough asset
        // to repay the Aave premium.
        //
        // The borrowed amount itself is temporarily
        // supplied by Aave.
        //
        // The tester must already contain enough of the
        // asset to cover the premium.
        //==================================================

        uint256 balance =
            IERC20Minimal(asset).balanceOf(
                address(this)
            );


        if(balance < totalRepayment)
        {
            revert InsufficientRepayment();
        }


        //==================================================
        // Approve Aave Pool
        //==================================================

        IERC20Minimal(asset).approve(
            address(aavePool),
            0
        );

        IERC20Minimal(asset).approve(
            address(aavePool),
            totalRepayment
        );


        //==================================================
        // Save test information
        //==================================================

        lastPremium = premium;


        emit FlashLoanTestCompleted(
            asset,
            amount,
            premium
        );


        return true;
    }


    //======================================================
    // Get Aave Pool
    //======================================================

    function getAavePool()
        external
        view
        returns(address)
    {
        return
            aaveAddressesProvider.getPool();
    }


    //======================================================
    // Get tester token balance
    //======================================================

    function getTokenBalance(
        address token
    )
        external
        view
        returns(uint256)
    {
        return
            IERC20Minimal(token).balanceOf(
                address(this)
            );
    }


    //======================================================
    // Transfer ERC20 token to owner
    //
    // Used to recover test USDC after testing.
    //======================================================

    function withdrawToken(
        address token,
        uint256 amount
    )
        external
        onlyOwner
    {
        if(token == address(0))
            revert InvalidAsset();

        bool success =
            IERC20Minimal(token).transfer(
                owner,
                amount
            );

        if(!success)
            revert TransferFailed();
    }


    //======================================================
    // Transfer ownership
    //======================================================

    function transferOwnership(
        address newOwner
    )
        external
        onlyOwner
    {
        if(newOwner == address(0))
            revert Unauthorized();

        address previousOwner =
            owner;

        owner = newOwner;

        emit OwnershipTransferred(
            previousOwner,
            newOwner
        );
    }
}


/**
 * @dev Minimal ERC20 interface.
 *
 * We use this instead of importing an additional
 * OpenZeppelin dependency.
 */
interface IERC20Minimal
{
    function balanceOf(
        address account
    )
        external
        view
        returns(uint256);

    function approve(
        address spender,
        uint256 amount
    )
        external
        returns(bool);

    function transfer(
        address to,
        uint256 amount
    )
        external
        returns(bool);
}