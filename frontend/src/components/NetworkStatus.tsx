function NetworkStatus() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />

      <div className="hidden sm:block">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          Network
        </p>

        <p className="text-sm font-medium text-emerald-400">
          Ethereum Sepolia
        </p>
      </div>
    </div>
  )
}

export default NetworkStatus