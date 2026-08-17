# Windows on Arm Support

Adobe now supports Windows on Arm effect plugins in some products running natively on Windows on Arm. For instance, After Effects effect plugins are also available in Adobe Premiere Pro and Adobe Media Encoder.

Not all Adobe products have native Windows on Arm versions yet, but in those that do, only effect plugins with Windows on Arm implementations will be available. We recommend adding the Windows on Arm target soon in anticipation of rapid adoption of these new Windows on Arm machines.

!!! note
    In order to build a Windows on Arm binary, you will need Visual Studio 17.4 or greater.

To learn more about adding Windows on Arm support, please visit [https://learn.microsoft.com/en-us/windows/arm/add-arm-support](https://learn.microsoft.com/en-us/windows/arm/add-arm-support)

---

## How to add Windows on Arm Support for your Plugins

1. Open your plugin's Visual Studio solution in version 17.4 or above and select the ARM64 target.

    ![Visual Studio ARM64 target](../_static/visual-studio-arm64-target.png "Visual Studio ARM64 target")
    *Visual Studio ARM64 target*

2. Tell After Effects what the main entry point is for Windows on Arm builds.

    > * Find the .r resource file for your plugin.
    > * Add `CodeWinARM64 {"EffectMain"}` next to your existing Windows on Intel entry point definition.
    >   ```cpp
    >   #if defined(AE_OS_WIN)
    >     CodeWinARM64 {"EffectMain"},
    >     CodeWin64X86 {"EffectMain"},
    >   #endif
    >   ```
    > * If for some reason you need different entry points for Intel and Arm, just provide a different entry point name and string.

3. Compile the Windows on Arm binary by building for the ARM64 target.

Assuming there are no compile time issues with the Windows on Arm build, you can now use the binary with the Windows on Arm native product.

```
